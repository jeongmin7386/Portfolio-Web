import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { queryClient } from '../../app/queryClient';
import { blockLabel, defaultBlockContent } from '../../features/site-builder/blockCatalog';
import { BlockEditorCard } from '../../features/site-builder/components/BlockEditorCard';
import { BlockPalette } from '../../features/site-builder/components/BlockPalette';
import { BlockRenderer } from '../../features/site-builder/components/BlockRenderer';
import {
  createBlock,
  createBuilderProject,
  createPage,
  createProjectBlock,
  deleteBlock,
  deleteBuilderProject,
  deletePage,
  deleteProjectBlock,
  getBuilderState,
  getPageWithBlocks,
  getProjectWithBlocks,
  updateBlock,
  updateBuilderProject,
  updatePage,
  updateProjectBlock,
  updateSite
} from '../../features/site-builder/siteBuilderApi';
import type { BlockType, BuilderProject, BuilderProjectPayload, PagePayload, SiteBlock, SitePage } from '../../features/site-builder/types';
import { assetUrl, getApiErrorMessage } from '../../lib/apiClient';

type SelectedTarget = {
  type: 'page' | 'project';
  id: number | null;
};

type BlockDraftMap = Record<number, SiteBlock>;

const defaultBlockSettings = {
  width: 'normal',
  align: 'left',
  paddingTop: 0,
  paddingBottom: 0
};

export function BuilderMvpPage() {
  const [selectedTarget, setSelectedTarget] = useState<SelectedTarget>({ type: 'page', id: null });
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [pageDraft, setPageDraft] = useState<PagePayload | null>(null);
  const [projectDraft, setProjectDraft] = useState<BuilderProjectPayload | null>(null);
  const [blockDrafts, setBlockDrafts] = useState<BlockDraftMap>({});
  const [siteTitle, setSiteTitle] = useState('');
  const [siteDescription, setSiteDescription] = useState('');

  const stateQuery = useQuery({ queryKey: ['builderState'], queryFn: getBuilderState });
  const pages = stateQuery.data?.pages ?? [];
  const projects = stateQuery.data?.projects ?? [];
  const selectedPage = selectedTarget.type === 'page' ? pages.find((page) => page.id === selectedTarget.id) ?? pages[0] : undefined;
  const selectedProject =
    selectedTarget.type === 'project' ? projects.find((project) => project.id === selectedTarget.id) ?? projects[0] : undefined;

  const pageQuery = useQuery({
    queryKey: ['builderPage', selectedPage?.id],
    queryFn: () => getPageWithBlocks(selectedPage!.id),
    enabled: Boolean(selectedPage?.id && selectedTarget.type === 'page')
  });

  const projectQuery = useQuery({
    queryKey: ['builderProject', selectedProject?.id],
    queryFn: () => getProjectWithBlocks(selectedProject!.id),
    enabled: Boolean(selectedProject?.id && selectedTarget.type === 'project')
  });

  const serverBlocks = useMemo(
    () => (selectedTarget.type === 'project' ? projectQuery.data?.blocks ?? [] : pageQuery.data?.blocks ?? []),
    [pageQuery.data, projectQuery.data, selectedTarget.type]
  );

  const draftBlocks = useMemo(
    () => serverBlocks.map((block) => blockDrafts[block.id] ?? block).sort((first, second) => first.sortOrder - second.sortOrder),
    [serverBlocks, blockDrafts]
  );

  const selectedBlock = selectedBlockId ? draftBlocks.find((block) => block.id === selectedBlockId) : draftBlocks[0];
  const previewProject = selectedProject && projectDraft ? projectFromDraft(selectedProject, projectDraft) : selectedProject;
  const previewPage = selectedPage && pageDraft ? pageFromDraft(selectedPage, pageDraft) : selectedPage;
  const previewPages = pages.map((page) => (previewPage?.id === page.id ? previewPage : page));

  useEffect(() => {
    if (!selectedTarget.id && pages[0]) {
      setSelectedTarget({ type: 'page', id: pages[0].id });
    }
  }, [pages, selectedTarget.id]);

  useEffect(() => {
    if (stateQuery.data?.site) {
      setSiteTitle(stateQuery.data.site.title);
      setSiteDescription(stateQuery.data.site.description ?? '');
    }
  }, [stateQuery.data?.site]);

  useEffect(() => {
    if (selectedPage) {
      setPageDraft(pageToPayload(selectedPage));
    }
  }, [selectedPage?.id, selectedPage?.title, selectedPage?.slug, selectedPage?.publicPage, selectedPage?.navVisible, selectedPage?.sortOrder]);

  useEffect(() => {
    if (selectedProject) {
      setProjectDraft(projectToPayload(selectedProject));
    }
  }, [selectedProject?.id, selectedProject?.title, selectedProject?.slug, selectedProject?.sortOrder]);

  useEffect(() => {
    const nextDrafts = serverBlocks.reduce<BlockDraftMap>((drafts, block) => {
      drafts[block.id] = block;
      return drafts;
    }, {});
    setBlockDrafts(nextDrafts);
    setSelectedBlockId((current) => (current && serverBlocks.some((block) => block.id === current) ? current : serverBlocks[0]?.id ?? null));
  }, [serverBlocks]);

  const createPageMutation = useMutation({
    mutationFn: createPage,
    onSuccess: (page) => {
      console.log('[builder:create-page-success]', page);
      setNewPageTitle('');
      setSelectedTarget({ type: 'page', id: page.id });
      queryClient.invalidateQueries({ queryKey: ['builderState'] });
    }
  });

  const createProjectMutation = useMutation({
    mutationFn: createBuilderProject,
    onSuccess: (project) => {
      console.log('[builder:create-project-success]', project);
      setNewProjectTitle('');
      setSelectedTarget({ type: 'project', id: project.id });
      queryClient.invalidateQueries({ queryKey: ['builderState'] });
    }
  });

  const updatePageMutation = useMutation({
    mutationFn: ({ pageId, payload }: { pageId: number; payload: PagePayload }) => updatePage(pageId, payload),
    onSuccess: (page) => {
      console.log('[builder:update-page-success]', page);
      setPageDraft(pageToPayload(page));
      queryClient.invalidateQueries({ queryKey: ['builderState'] });
    }
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ projectId, payload }: { projectId: number; payload: BuilderProjectPayload }) => updateBuilderProject(projectId, payload),
    onSuccess: (project) => {
      console.log('[builder:update-project-success]', project);
      setProjectDraft(projectToPayload(project));
      queryClient.invalidateQueries({ queryKey: ['builderState'] });
      queryClient.invalidateQueries({ queryKey: ['builderProject', project.id] });
    }
  });

  const deletePageMutation = useMutation({
    mutationFn: deletePage,
    onSuccess: () => {
      setSelectedTarget({ type: 'page', id: null });
      setSelectedBlockId(null);
      queryClient.invalidateQueries({ queryKey: ['builderState'] });
    }
  });

  const deleteProjectMutation = useMutation({
    mutationFn: deleteBuilderProject,
    onSuccess: () => {
      setSelectedTarget({ type: 'page', id: pages[0]?.id ?? null });
      setSelectedBlockId(null);
      queryClient.invalidateQueries({ queryKey: ['builderState'] });
    }
  });

  const updateSiteMutation = useMutation({
    mutationFn: updateSite,
    onSuccess: (site) => {
      console.log('[builder:update-site-success]', site);
      setSiteTitle(site.title);
      setSiteDescription(site.description ?? '');
      queryClient.invalidateQueries({ queryKey: ['builderState'] });
    }
  });

  const createBlockMutation = useMutation({
    mutationFn: ({ type }: { type: BlockType }) => {
      const payload = { blockType: type, content: defaultBlockContent(type), settings: defaultBlockSettings, visible: true };
      if (selectedTarget.type === 'project' && selectedProject) {
        return createProjectBlock(selectedProject.id, payload);
      }
      if (selectedPage) {
        return createBlock(selectedPage.id, payload);
      }
      throw new Error('No selected target');
    },
    onSuccess: (block) => {
      console.log('[builder:create-block-success]', block);
      setSelectedBlockId(block.id);
      setBlockDrafts((current) => ({ ...current, [block.id]: block }));
      invalidateSelectedTarget(selectedTarget);
    }
  });

  const updateBlockMutation = useMutation({
    mutationFn: ({ block, content, settings, visible }: { block: SiteBlock; content: Record<string, unknown>; settings: Record<string, unknown>; visible: boolean }) => {
      const payload = { blockType: block.blockType, content, settings, visible, sortOrder: block.sortOrder };
      console.log('[builder:block-save-request]', { blockId: block.id, payload });
      if (block.projectId) {
        return updateProjectBlock(block.projectId, block.id, payload);
      }
      return updateBlock(block.pageId!, block.id, payload);
    },
    onSuccess: (block) => {
      console.log('[builder:block-save-success]', block);
      setBlockDrafts((current) => ({ ...current, [block.id]: block }));
      invalidateSelectedTarget(selectedTarget);
    }
  });

  const deleteBlockMutation = useMutation({
    mutationFn: (block: SiteBlock) => (block.projectId ? deleteProjectBlock(block.projectId, block.id) : deleteBlock(block.pageId!, block.id)),
    onSuccess: (_, block) => {
      setBlockDrafts((current) => {
        const next = { ...current };
        delete next[block.id];
        return next;
      });
      setSelectedBlockId(null);
      invalidateSelectedTarget(selectedTarget);
    }
  });

  function invalidateSelectedTarget(target: SelectedTarget) {
    if (target.type === 'project') {
      queryClient.invalidateQueries({ queryKey: ['builderProject', target.id] });
    } else {
      queryClient.invalidateQueries({ queryKey: ['builderPage', target.id] });
    }
  }

  function patchSite(field: 'title' | 'description', value: string) {
    console.log('[builder:site-change]', { field, value });
    if (field === 'title') {
      setSiteTitle(value);
    } else {
      setSiteDescription(value);
    }
  }

  function patchPage<K extends keyof PagePayload>(field: K, value: PagePayload[K]) {
    setPageDraft((current) => {
      const next = { ...(current ?? {}), [field]: value } as PagePayload;
      console.log('[builder:page-change]', { field, value, next });
      return next;
    });
  }

  function patchProject<K extends keyof BuilderProjectPayload>(field: K, value: BuilderProjectPayload[K]) {
    setProjectDraft((current) => {
      const next = { ...(current ?? { title: '' }), [field]: value } as BuilderProjectPayload;
      console.log('[builder:project-change]', { field, value, next });
      return next;
    });
  }

  function patchBlock(block: SiteBlock, content: Record<string, unknown>, settings: Record<string, unknown>, visible: boolean) {
    const nextBlock = { ...block, content, settings, visible };
    console.log('[builder:preview-block-draft]', nextBlock);
    setBlockDrafts((current) => ({ ...current, [block.id]: nextBlock }));
  }

  function handleCreatePage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newPageTitle.trim()) {
      return;
    }
    createPageMutation.mutate({
      title: newPageTitle.trim(),
      slug: newPageTitle.trim(),
      pageType: 'CUSTOM',
      publicPage: true,
      navVisible: true,
      sortOrder: pages.length
    });
  }

  function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newProjectTitle.trim()) {
      return;
    }
    createProjectMutation.mutate({
      title: newProjectTitle.trim(),
      slug: newProjectTitle.trim(),
      subtitle: '',
      summary: '',
      description: '',
      category: 'Portfolio',
      period: '',
      role: '',
      contribution: '',
      techStacks: [],
      visibility: 'PUBLIC',
      sortOrder: projects.length
    });
  }

  function handleSaveSite() {
    const site = stateQuery.data?.site;
    if (!site) {
      return;
    }
    updateSiteMutation.mutate({
      slug: site.slug,
      title: siteTitle,
      description: siteDescription,
      profileImageUrl: site.profileImageUrl,
      published: true,
      themeId: site.theme?.id
    });
  }

  function handleSavePage() {
    if (!selectedPage || !pageDraft) {
      return;
    }
    updatePageMutation.mutate({ pageId: selectedPage.id, payload: pageDraft });
  }

  function handleSaveProject() {
    if (!selectedProject || !projectDraft) {
      return;
    }
    updateProjectMutation.mutate({ projectId: selectedProject.id, payload: projectDraft });
  }

  function handleSaveBlock(block: SiteBlock) {
    updateBlockMutation.mutate({
      block,
      content: block.content ?? {},
      settings: block.settings ?? {},
      visible: block.visible
    });
  }

  function handleSaveCurrentDrafts() {
    console.log('[builder:save-current-drafts]', {
      selectedTarget,
      site: { title: siteTitle, description: siteDescription },
      pageDraft,
      projectDraft,
      selectedBlock
    });
    handleSaveSite();
    if (selectedTarget.type === 'page') {
      handleSavePage();
    }
    if (selectedTarget.type === 'project') {
      handleSaveProject();
    }
    if (selectedBlock) {
      handleSaveBlock(selectedBlock);
    }
  }

  if (stateQuery.isLoading) {
    return <div className="center-screen">사이트 빌더를 준비하는 중입니다...</div>;
  }

  if (stateQuery.isError || !stateQuery.data) {
    return <div className="center-screen">{getApiErrorMessage(stateQuery.error, '사이트 빌더를 불러오지 못했습니다.')}</div>;
  }

  const previewTitle = previewProject?.title ?? previewPage?.title ?? '페이지';
  const publicPreviewUrl = selectedProject ? `/site/projects/${selectedProject.slug}` : '/site';
  const isSavingCurrent =
    updateSiteMutation.isPending || updatePageMutation.isPending || updateProjectMutation.isPending || updateBlockMutation.isPending;

  return (
    <main className="builder-mvp-page">
      <aside className="builder-page-panel">
        <div className="builder-brand">
          <p className="eyebrow">블록 사이트 빌더</p>
          <h1>캔버스폴리오</h1>
          <span>페이지와 프로젝트 상세 페이지를 블록 단위로 편집하세요.</span>
        </div>

        <form className="builder-new-page" onSubmit={handleCreatePage}>
          <label className="field">
            <span>새 페이지</span>
            <input value={newPageTitle} onChange={(event) => setNewPageTitle(event.target.value)} placeholder="예: About, Contact" />
          </label>
          <button className="button button-primary" type="submit" disabled={createPageMutation.isPending}>
            페이지 만들기
          </button>
        </form>

        <div className="builder-panel-section">
          <p className="panel-label">페이지</p>
          <div className="builder-page-list">
            {previewPages.map((page) => (
              <button
                key={page.id}
                type="button"
                className={selectedTarget.type === 'page' && selectedPage?.id === page.id ? 'active' : ''}
                onClick={() => setSelectedTarget({ type: 'page', id: page.id })}
              >
                <span>{page.title}</span>
                <small>{page.publicPage ? '공개' : '비공개'} · {page.navVisible ? '메뉴 표시' : '메뉴 숨김'}</small>
              </button>
            ))}
          </div>
        </div>

        <form className="builder-new-page" onSubmit={handleCreateProject}>
          <label className="field">
            <span>새 프로젝트</span>
            <input value={newProjectTitle} onChange={(event) => setNewProjectTitle(event.target.value)} placeholder="예: Portfolio Builder" />
          </label>
          <button className="button button-primary" type="submit" disabled={createProjectMutation.isPending}>
            프로젝트 만들기
          </button>
        </form>

        <div className="builder-panel-section">
          <p className="panel-label">프로젝트</p>
          <div className="builder-page-list">
            {projects.map((project) => {
              const item = previewProject?.id === project.id ? previewProject : project;
              return (
                <button
                  key={project.id}
                  type="button"
                  className={selectedTarget.type === 'project' && selectedProject?.id === project.id ? 'active' : ''}
                  onClick={() => setSelectedTarget({ type: 'project', id: project.id })}
                >
                  <span>{item.title}</span>
                  <small>{item.visibility === 'PUBLIC' ? '공개' : item.visibility === 'PRIVATE' ? '비공개' : '초안'} · {item.category || '카테고리 없음'}</small>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      <section className="builder-canvas-panel">
        <header className="builder-toolbar">
          <div>
            <p className="eyebrow">{selectedTarget.type === 'project' ? '프로젝트 상세 미리보기' : '페이지 미리보기'}</p>
            <h2>{previewTitle}</h2>
          </div>
          <div className="action-row">
            <Link className="button button-secondary" to={publicPreviewUrl} target="_blank">
              공개 페이지 보기
            </Link>
            <button className="button button-primary" type="button" onClick={handleSaveCurrentDrafts} disabled={isSavingCurrent}>
              {isSavingCurrent ? '저장 중...' : '저장 / 게시'}
            </button>
          </div>
        </header>

        <article className="builder-site-preview">
          <nav className="builder-preview-nav">
            <strong>{siteTitle || stateQuery.data.site.title}</strong>
            <div>
              {previewPages
                .filter((page) => page.navVisible)
                .map((page) => (
                  <button key={page.id} type="button" onClick={() => setSelectedTarget({ type: 'page', id: page.id })}>
                    {page.title}
                  </button>
                ))}
            </div>
          </nav>
          <div className="builder-preview-body">
            {previewProject ? <ProjectPreviewHero project={previewProject} /> : null}
            {draftBlocks.length ? (
              draftBlocks.filter((block) => block.visible).map((block) => <BlockRenderer key={block.id} block={block} />)
            ) : (
              <div className="builder-empty-preview">
                <p className="eyebrow">빈 페이지</p>
                <h3>오른쪽 패널에서 블록을 추가하세요.</h3>
              </div>
            )}
          </div>
        </article>
      </section>

      <aside className="builder-inspector-panel">
        <section className="inspector-section">
          <p className="panel-label">사이트 설정</p>
          <label className="field">
            <span>사이트 제목</span>
            <input value={siteTitle} onChange={(event) => patchSite('title', event.target.value)} />
          </label>
          <label className="field">
            <span>사이트 소개</span>
            <textarea value={siteDescription} onChange={(event) => patchSite('description', event.target.value)} />
          </label>
        </section>

        {selectedPage && pageDraft ? (
          <PageSettingsPanel
            page={previewPage ?? selectedPage}
            draft={pageDraft}
            isSaving={updatePageMutation.isPending}
            onPatch={patchPage}
            onSave={handleSavePage}
            onDelete={() => deletePageMutation.mutate(selectedPage.id)}
          />
        ) : null}

        {selectedProject && projectDraft ? (
          <ProjectSettingsPanel
            project={previewProject ?? selectedProject}
            draft={projectDraft}
            isSaving={updateProjectMutation.isPending}
            onPatch={patchProject}
            onSave={handleSaveProject}
            onDelete={() => deleteProjectMutation.mutate(selectedProject.id)}
          />
        ) : null}

        {selectedPage || selectedProject ? (
          <section className="inspector-section">
            <p className="panel-label">블록 추가</p>
            <BlockPalette isAdding={createBlockMutation.isPending} onAdd={(type) => createBlockMutation.mutate({ type })} />
          </section>
        ) : null}

        <section className="inspector-section">
          <p className="panel-label">블록 목록</p>
          {pageQuery.isLoading || projectQuery.isLoading ? <p className="muted">블록을 불러오는 중입니다...</p> : null}
          <div className="builder-block-picker">
            {draftBlocks.map((block) => (
              <button
                key={block.id}
                type="button"
                className={selectedBlock?.id === block.id ? 'active' : ''}
                onClick={() => setSelectedBlockId(block.id)}
              >
                <span>{blockLabel(block.blockType)}</span>
                <small>{block.visible ? '공개' : '비공개'} · 순서 {block.sortOrder + 1}</small>
              </button>
            ))}
          </div>
          {!draftBlocks.length && !pageQuery.isLoading && !projectQuery.isLoading ? (
            <p className="muted">아직 블록이 없습니다. 제목이나 프로젝트 정보 블록을 추가해보세요.</p>
          ) : null}
        </section>

        {selectedBlock ? (
          <section className="inspector-section">
            <BlockEditorCard
              key={selectedBlock.id}
              block={selectedBlock}
              isSaving={updateBlockMutation.isPending}
              onChange={(content, settings, visible) => patchBlock(selectedBlock, content, settings, visible)}
              onSave={(content, settings, visible) => updateBlockMutation.mutate({ block: selectedBlock, content, settings, visible })}
              onDelete={() => deleteBlockMutation.mutate(selectedBlock)}
            />
          </section>
        ) : null}

        {(createPageMutation.isError ||
          updatePageMutation.isError ||
          createProjectMutation.isError ||
          updateProjectMutation.isError ||
          createBlockMutation.isError ||
          updateBlockMutation.isError) && <p className="form-error">요청을 저장하지 못했습니다. 입력값을 확인해주세요.</p>}
      </aside>
    </main>
  );
}

function pageToPayload(page: SitePage): PagePayload {
  return {
    title: page.title,
    slug: page.slug,
    pageType: page.pageType,
    publicPage: page.publicPage,
    navVisible: page.navVisible,
    sortOrder: page.sortOrder,
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription
  };
}

function pageFromDraft(page: SitePage, draft: PagePayload): SitePage {
  return {
    ...page,
    title: draft.title,
    slug: draft.slug ?? page.slug,
    pageType: draft.pageType ?? page.pageType,
    publicPage: draft.publicPage ?? page.publicPage,
    navVisible: draft.navVisible ?? page.navVisible,
    sortOrder: draft.sortOrder ?? page.sortOrder,
    seoTitle: draft.seoTitle,
    seoDescription: draft.seoDescription
  };
}

function projectToPayload(project: BuilderProject): BuilderProjectPayload {
  return {
    title: project.title,
    slug: project.slug,
    subtitle: project.subtitle,
    summary: project.summary,
    description: project.description,
    period: project.period,
    role: project.role,
    contribution: project.contribution,
    category: project.category,
    thumbnailUrl: project.thumbnailUrl,
    techStacks: project.techStacks,
    githubUrl: project.githubUrl,
    liveUrl: project.liveUrl,
    visibility: project.visibility,
    sortOrder: project.sortOrder,
    seoTitle: project.seoTitle,
    seoDescription: project.seoDescription
  };
}

function projectFromDraft(project: BuilderProject, draft: BuilderProjectPayload): BuilderProject {
  return {
    ...project,
    title: draft.title,
    slug: draft.slug ?? project.slug,
    subtitle: draft.subtitle,
    summary: draft.summary,
    description: draft.description,
    period: draft.period,
    role: draft.role,
    contribution: draft.contribution,
    category: draft.category,
    thumbnailUrl: draft.thumbnailUrl,
    techStacks: draft.techStacks ?? project.techStacks,
    githubUrl: draft.githubUrl,
    liveUrl: draft.liveUrl,
    visibility: draft.visibility ?? project.visibility,
    sortOrder: draft.sortOrder ?? project.sortOrder,
    seoTitle: draft.seoTitle,
    seoDescription: draft.seoDescription
  };
}

function ProjectPreviewHero({ project }: { project: BuilderProject }) {
  const metaItems = [
    project.period,
    project.role,
    project.contribution,
    project.category
  ].filter(Boolean);

  return (
    <header className="builder-project-hero">
      {project.category ? <p className="eyebrow">{project.category}</p> : null}
      <div className="builder-project-hero-grid">
        <div>
          <h1>{project.title}</h1>
          {project.subtitle ? <h2>{project.subtitle}</h2> : null}
          {project.summary ? <p>{project.summary}</p> : null}
          {metaItems.length ? (
            <div className="builder-project-meta">
              {metaItems.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          ) : null}
          {project.techStacks.length ? (
            <div className="builder-tech-stack">
              {project.techStacks.map((tech) => (
                <span key={tech}>{tech}</span>
              ))}
            </div>
          ) : null}
          {(project.githubUrl || project.liveUrl) ? (
            <div className="action-row">
              {project.githubUrl ? (
                <a className="button button-secondary" href={project.githubUrl} target="_blank" rel="noreferrer">
                  GitHub
                </a>
              ) : null}
              {project.liveUrl ? (
                <a className="button button-primary" href={project.liveUrl} target="_blank" rel="noreferrer">
                  배포 사이트
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
        {project.thumbnailUrl ? (
          <figure className="builder-project-cover">
            <img src={assetUrl(project.thumbnailUrl)} alt={project.title} />
          </figure>
        ) : null}
      </div>
      {project.description ? <p className="builder-project-description">{project.description}</p> : null}
    </header>
  );
}

function PageSettingsPanel({
  page,
  draft,
  isSaving,
  onPatch,
  onSave,
  onDelete
}: {
  page: SitePage;
  draft: PagePayload;
  isSaving: boolean;
  onPatch: <K extends keyof PagePayload>(field: K, value: PagePayload[K]) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  return (
    <section className="inspector-section">
      <div className="block-editor-card-header">
        <div>
          <p className="panel-label">페이지 설정</p>
          <h3>{page.title}</h3>
        </div>
        <button className="button button-ghost" type="button" onClick={onDelete}>
          삭제
        </button>
      </div>
      <label className="field">
        <span>페이지 제목</span>
        <input value={draft.title} onChange={(event) => onPatch('title', event.target.value)} />
      </label>
      <label className="field">
        <span>공개 주소</span>
        <input value={draft.slug ?? ''} onChange={(event) => onPatch('slug', event.target.value)} />
      </label>
      <label className="field">
        <span>정렬 순서</span>
        <input type="number" value={draft.sortOrder ?? 0} onChange={(event) => onPatch('sortOrder', Number(event.target.value))} />
      </label>
      <div className="builder-toggle-row">
        <label>
          <input type="checkbox" checked={Boolean(draft.publicPage)} onChange={(event) => onPatch('publicPage', event.target.checked)} />
          공개 페이지
        </label>
        <label>
          <input type="checkbox" checked={Boolean(draft.navVisible)} onChange={(event) => onPatch('navVisible', event.target.checked)} />
          메뉴에 표시
        </label>
      </div>
      <label className="field">
        <span>SEO 제목</span>
        <input value={draft.seoTitle ?? ''} onChange={(event) => onPatch('seoTitle', event.target.value)} />
      </label>
      <label className="field">
        <span>SEO 설명</span>
        <textarea value={draft.seoDescription ?? ''} onChange={(event) => onPatch('seoDescription', event.target.value)} />
      </label>
      <button className="button button-primary" type="button" disabled={isSaving} onClick={onSave}>
        {isSaving ? '저장 중...' : '페이지 저장'}
      </button>
    </section>
  );
}

function ProjectSettingsPanel({
  project,
  draft,
  isSaving,
  onPatch,
  onSave,
  onDelete
}: {
  project: BuilderProject;
  draft: BuilderProjectPayload;
  isSaving: boolean;
  onPatch: <K extends keyof BuilderProjectPayload>(field: K, value: BuilderProjectPayload[K]) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  return (
    <section className="inspector-section">
      <div className="block-editor-card-header">
        <div>
          <p className="panel-label">프로젝트 설정</p>
          <h3>{project.title}</h3>
        </div>
        <button className="button button-ghost" type="button" onClick={onDelete}>
          삭제
        </button>
      </div>
      <label className="field">
        <span>프로젝트 제목</span>
        <input value={draft.title} onChange={(event) => onPatch('title', event.target.value)} />
      </label>
      <label className="field">
        <span>공개 URL</span>
        <input value={draft.slug ?? ''} onChange={(event) => onPatch('slug', event.target.value)} />
      </label>
      <label className="field">
        <span>짧은 부제목</span>
        <input value={draft.subtitle ?? ''} onChange={(event) => onPatch('subtitle', event.target.value)} />
      </label>
      <label className="field">
        <span>짧은 설명</span>
        <textarea value={draft.summary ?? ''} onChange={(event) => onPatch('summary', event.target.value)} />
      </label>
      <label className="field">
        <span>케이스 스터디 본문</span>
        <textarea value={draft.description ?? ''} onChange={(event) => onPatch('description', event.target.value)} />
      </label>
      <div className="compact-field-grid">
        <label className="field">
          <span>카테고리</span>
          <input value={draft.category ?? ''} onChange={(event) => onPatch('category', event.target.value)} />
        </label>
        <label className="field">
          <span>정렬 순서</span>
          <input type="number" value={draft.sortOrder ?? 0} onChange={(event) => onPatch('sortOrder', Number(event.target.value))} />
        </label>
      </div>
      <div className="compact-field-grid">
        <label className="field">
          <span>기간</span>
          <input value={draft.period ?? ''} onChange={(event) => onPatch('period', event.target.value)} />
        </label>
        <label className="field">
          <span>역할</span>
          <input value={draft.role ?? ''} onChange={(event) => onPatch('role', event.target.value)} />
        </label>
      </div>
      <div className="compact-field-grid">
        <label className="field">
          <span>기여도</span>
          <input value={draft.contribution ?? ''} onChange={(event) => onPatch('contribution', event.target.value)} />
        </label>
        <label className="field">
          <span>공개 상태</span>
          <select value={draft.visibility ?? 'PUBLIC'} onChange={(event) => onPatch('visibility', event.target.value as BuilderProjectPayload['visibility'])}>
            <option value="PUBLIC">공개</option>
            <option value="PRIVATE">비공개</option>
            <option value="DRAFT">초안</option>
          </select>
        </label>
      </div>
      <label className="field">
        <span>썸네일 이미지 URL</span>
        <input placeholder="https://..." value={draft.thumbnailUrl ?? ''} onChange={(event) => onPatch('thumbnailUrl', event.target.value)} />
      </label>
      <label className="field">
        <span>기술 스택</span>
        <input value={(draft.techStacks ?? []).join(', ')} onChange={(event) => onPatch('techStacks', csvToArray(event.target.value))} />
      </label>
      <label className="field">
        <span>GitHub 링크</span>
        <input value={draft.githubUrl ?? ''} onChange={(event) => onPatch('githubUrl', event.target.value)} />
      </label>
      <label className="field">
        <span>배포 링크</span>
        <input value={draft.liveUrl ?? ''} onChange={(event) => onPatch('liveUrl', event.target.value)} />
      </label>
      <label className="field">
        <span>SEO 제목</span>
        <input value={draft.seoTitle ?? ''} onChange={(event) => onPatch('seoTitle', event.target.value)} />
      </label>
      <label className="field">
        <span>SEO 설명</span>
        <textarea value={draft.seoDescription ?? ''} onChange={(event) => onPatch('seoDescription', event.target.value)} />
      </label>
      <button className="button button-primary" type="button" disabled={isSaving} onClick={onSave}>
        {isSaving ? '저장 중...' : '프로젝트 저장'}
      </button>
    </section>
  );
}

function csvToArray(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
