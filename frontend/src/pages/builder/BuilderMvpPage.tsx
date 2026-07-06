import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { queryClient } from '../../app/queryClient';
import { BlockEditorCard } from '../../features/site-builder/components/BlockEditorCard';
import { BlockPalette } from '../../features/site-builder/components/BlockPalette';
import { BlockRenderer } from '../../features/site-builder/components/BlockRenderer';
import { defaultBlockContent } from '../../features/site-builder/blockCatalog';
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
import type { BlockType, BuilderProject, BuilderProjectPayload, PagePayload, SiteBlock } from '../../features/site-builder/types';
import { getApiErrorMessage } from '../../lib/apiClient';

type SelectedTarget = {
  type: 'page' | 'project';
  id: number | null;
};

export function BuilderMvpPage() {
  const [selectedTarget, setSelectedTarget] = useState<SelectedTarget>({ type: 'page', id: null });
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [pageDraft, setPageDraft] = useState<PagePayload | null>(null);
  const [projectDraft, setProjectDraft] = useState<BuilderProjectPayload | null>(null);
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
      setPageDraft({
        title: selectedPage.title,
        slug: selectedPage.slug,
        pageType: selectedPage.pageType,
        publicPage: selectedPage.publicPage,
        navVisible: selectedPage.navVisible,
        sortOrder: selectedPage.sortOrder,
        seoTitle: selectedPage.seoTitle,
        seoDescription: selectedPage.seoDescription
      });
    }
  }, [selectedPage?.id]);

  useEffect(() => {
    if (selectedProject) {
      setProjectDraft(projectToPayload(selectedProject));
    }
  }, [selectedProject?.id]);

  const createPageMutation = useMutation({
    mutationFn: createPage,
    onSuccess: (page) => {
      setNewPageTitle('');
      setSelectedTarget({ type: 'page', id: page.id });
      queryClient.invalidateQueries({ queryKey: ['builderState'] });
    }
  });

  const createProjectMutation = useMutation({
    mutationFn: createBuilderProject,
    onSuccess: (project) => {
      setNewProjectTitle('');
      setSelectedTarget({ type: 'project', id: project.id });
      queryClient.invalidateQueries({ queryKey: ['builderState'] });
    }
  });

  const updatePageMutation = useMutation({
    mutationFn: ({ pageId, payload }: { pageId: number; payload: PagePayload }) => updatePage(pageId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['builderState'] })
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ projectId, payload }: { projectId: number; payload: BuilderProjectPayload }) => updateBuilderProject(projectId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['builderState'] })
  });

  const deletePageMutation = useMutation({
    mutationFn: deletePage,
    onSuccess: () => {
      setSelectedTarget({ type: 'page', id: null });
      queryClient.invalidateQueries({ queryKey: ['builderState'] });
    }
  });

  const deleteProjectMutation = useMutation({
    mutationFn: deleteBuilderProject,
    onSuccess: () => {
      setSelectedTarget({ type: 'page', id: pages[0]?.id ?? null });
      queryClient.invalidateQueries({ queryKey: ['builderState'] });
    }
  });

  const updateSiteMutation = useMutation({
    mutationFn: updateSite,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['builderState'] })
  });

  const createBlockMutation = useMutation({
    mutationFn: ({ type }: { type: BlockType }) => {
      const payload = { blockType: type, content: defaultBlockContent(type), visible: true };
      if (selectedTarget.type === 'project' && selectedProject) {
        return createProjectBlock(selectedProject.id, payload);
      }
      if (selectedPage) {
        return createBlock(selectedPage.id, payload);
      }
      throw new Error('No selected target');
    },
    onSuccess: () => invalidateSelectedTarget(selectedTarget)
  });

  const updateBlockMutation = useMutation({
    mutationFn: ({ block, content, settings, visible }: { block: SiteBlock; content: Record<string, unknown>; settings: Record<string, unknown>; visible: boolean }) => {
      const payload = { blockType: block.blockType, content, settings, visible, sortOrder: block.sortOrder };
      if (block.projectId) {
        return updateProjectBlock(block.projectId, block.id, payload);
      }
      return updateBlock(block.pageId!, block.id, payload);
    },
    onSuccess: () => invalidateSelectedTarget(selectedTarget)
  });

  const deleteBlockMutation = useMutation({
    mutationFn: (block: SiteBlock) => (block.projectId ? deleteProjectBlock(block.projectId, block.id) : deleteBlock(block.pageId!, block.id)),
    onSuccess: () => invalidateSelectedTarget(selectedTarget)
  });

  const blocks = useMemo(
    () => (selectedTarget.type === 'project' ? projectQuery.data?.blocks ?? [] : pageQuery.data?.blocks ?? []),
    [pageQuery.data, projectQuery.data, selectedTarget.type]
  );

  function invalidateSelectedTarget(target: SelectedTarget) {
    if (target.type === 'project') {
      queryClient.invalidateQueries({ queryKey: ['builderProject', target.id] });
    } else {
      queryClient.invalidateQueries({ queryKey: ['builderPage', target.id] });
    }
  }

  function handleCreatePage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newPageTitle.trim()) {
      return;
    }
    createPageMutation.mutate({
      title: newPageTitle.trim(),
      pageType: 'CUSTOM',
      publicPage: true,
      navVisible: true
    });
  }

  function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newProjectTitle.trim()) {
      return;
    }
    createProjectMutation.mutate({
      title: newProjectTitle.trim(),
      subtitle: '프로젝트 부제목을 입력하세요',
      summary: '프로젝트 요약을 입력하세요.',
      period: '2026.06 - 2026.07',
      role: '역할',
      contribution: '100%',
      techStacks: ['React'],
      visibility: 'PUBLIC'
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

  if (stateQuery.isLoading) {
    return <div className="center-screen">사이트 빌더를 준비하는 중입니다...</div>;
  }

  if (stateQuery.isError || !stateQuery.data) {
    return <div className="center-screen">{getApiErrorMessage(stateQuery.error, '사이트 빌더를 불러오지 못했습니다.')}</div>;
  }

  const previewTitle = selectedProject?.title ?? selectedPage?.title ?? '페이지';
  const publicPreviewUrl = selectedProject ? `/site/projects/${selectedProject.slug}` : '/site';

  return (
    <main className="builder-mvp-page">
      <aside className="builder-page-panel">
        <div className="builder-brand">
          <p className="eyebrow">블록 사이트 빌더</p>
          <h1>캔버스폴리오</h1>
          <span>페이지와 프로젝트 상세 페이지를 블록으로 편집하세요.</span>
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
            {pages.map((page) => (
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
            {projects.map((project) => (
              <button
                key={project.id}
                type="button"
                className={selectedTarget.type === 'project' && selectedProject?.id === project.id ? 'active' : ''}
                onClick={() => setSelectedTarget({ type: 'project', id: project.id })}
              >
                <span>{project.title}</span>
                <small>{project.visibility === 'PUBLIC' ? '공개' : '비공개'} · 상세 페이지</small>
              </button>
            ))}
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
            <button className="button button-primary" type="button" onClick={handleSaveSite} disabled={updateSiteMutation.isPending}>
              게시하기
            </button>
          </div>
        </header>

        <article className="builder-site-preview">
          <nav className="builder-preview-nav">
            <strong>{siteTitle || stateQuery.data.site.title}</strong>
            <div>
              {pages
                .filter((page) => page.navVisible)
                .map((page) => (
                  <button key={page.id} type="button" onClick={() => setSelectedTarget({ type: 'page', id: page.id })}>
                    {page.title}
                  </button>
                ))}
            </div>
          </nav>
          <div className="builder-preview-body">
            {selectedProject ? <ProjectPreviewHero project={selectedProject} /> : null}
            {blocks.length ? (
              blocks.filter((block) => block.visible).map((block) => <BlockRenderer key={block.id} block={block} />)
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
            <input value={siteTitle} onChange={(event) => setSiteTitle(event.target.value)} />
          </label>
          <label className="field">
            <span>사이트 소개</span>
            <textarea value={siteDescription} onChange={(event) => setSiteDescription(event.target.value)} />
          </label>
        </section>

        {selectedPage && pageDraft ? (
          <section className="inspector-section">
            <div className="block-editor-card-header">
              <div>
                <p className="panel-label">페이지 설정</p>
                <h3>{selectedPage.title}</h3>
              </div>
              <button className="button button-ghost" type="button" onClick={() => deletePageMutation.mutate(selectedPage.id)}>
                삭제
              </button>
            </div>
            <label className="field">
              <span>페이지 제목</span>
              <input value={pageDraft.title} onChange={(event) => setPageDraft({ ...pageDraft, title: event.target.value })} />
            </label>
            <label className="field">
              <span>공개 주소</span>
              <input value={pageDraft.slug} onChange={(event) => setPageDraft({ ...pageDraft, slug: event.target.value })} />
            </label>
            <div className="builder-toggle-row">
              <label>
                <input
                  type="checkbox"
                  checked={Boolean(pageDraft.publicPage)}
                  onChange={(event) => setPageDraft({ ...pageDraft, publicPage: event.target.checked })}
                />
                공개 페이지
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={Boolean(pageDraft.navVisible)}
                  onChange={(event) => setPageDraft({ ...pageDraft, navVisible: event.target.checked })}
                />
                메뉴에 표시
              </label>
            </div>
            <button className="button button-primary" type="button" disabled={updatePageMutation.isPending} onClick={handleSavePage}>
              페이지 저장
            </button>
          </section>
        ) : null}

        {selectedProject && projectDraft ? (
          <ProjectSettingsPanel
            project={selectedProject}
            draft={projectDraft}
            isSaving={updateProjectMutation.isPending}
            onChange={setProjectDraft}
            onSave={handleSaveProject}
            onDelete={() => deleteProjectMutation.mutate(selectedProject.id)}
          />
        ) : null}

        {(selectedPage || selectedProject) ? (
          <section className="inspector-section">
            <p className="panel-label">블록 추가</p>
            <BlockPalette isAdding={createBlockMutation.isPending} onAdd={(type) => createBlockMutation.mutate({ type })} />
          </section>
        ) : null}

        <section className="inspector-section">
          <p className="panel-label">블록 목록</p>
          {pageQuery.isLoading || projectQuery.isLoading ? <p className="muted">블록을 불러오는 중입니다...</p> : null}
          {blocks.map((block) => (
            <BlockEditorCard
              key={block.id}
              block={block}
              isSaving={updateBlockMutation.isPending}
              onSave={(content, settings, visible) => updateBlockMutation.mutate({ block, content, settings, visible })}
              onDelete={() => deleteBlockMutation.mutate(block)}
            />
          ))}
          {!blocks.length && !pageQuery.isLoading && !projectQuery.isLoading ? (
            <p className="muted">아직 블록이 없습니다. 제목이나 프로젝트 정보 블록을 추가해보세요.</p>
          ) : null}
        </section>

        {(createPageMutation.isError || updatePageMutation.isError || createBlockMutation.isError || updateBlockMutation.isError) && (
          <p className="form-error">요청을 저장하지 못했습니다. 입력값을 확인해주세요.</p>
        )}
      </aside>
    </main>
  );
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

function ProjectPreviewHero({ project }: { project: BuilderProject }) {
  return (
    <header className="builder-project-hero">
      <p className="eyebrow">프로젝트 상세</p>
      <h1>{project.title}</h1>
      {project.subtitle ? <h2>{project.subtitle}</h2> : null}
      {project.summary ? <p>{project.summary}</p> : null}
      <div className="builder-project-meta">
        <span>{project.period || '기간'}</span>
        <span>{project.role || '역할'}</span>
        <span>{project.contribution || '기여도'}</span>
      </div>
    </header>
  );
}

function ProjectSettingsPanel({
  project,
  draft,
  isSaving,
  onChange,
  onSave,
  onDelete
}: {
  project: BuilderProject;
  draft: BuilderProjectPayload;
  isSaving: boolean;
  onChange: (draft: BuilderProjectPayload) => void;
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
        <input value={draft.title} onChange={(event) => onChange({ ...draft, title: event.target.value })} />
      </label>
      <label className="field">
        <span>부제목</span>
        <input value={draft.subtitle ?? ''} onChange={(event) => onChange({ ...draft, subtitle: event.target.value })} />
      </label>
      <label className="field">
        <span>요약</span>
        <textarea value={draft.summary ?? ''} onChange={(event) => onChange({ ...draft, summary: event.target.value })} />
      </label>
      <div className="compact-field-grid">
        <label className="field">
          <span>기간</span>
          <input value={draft.period ?? ''} onChange={(event) => onChange({ ...draft, period: event.target.value })} />
        </label>
        <label className="field">
          <span>역할</span>
          <input value={draft.role ?? ''} onChange={(event) => onChange({ ...draft, role: event.target.value })} />
        </label>
      </div>
      <div className="compact-field-grid">
        <label className="field">
          <span>기여도</span>
          <input value={draft.contribution ?? ''} onChange={(event) => onChange({ ...draft, contribution: event.target.value })} />
        </label>
        <label className="field">
          <span>공개 상태</span>
          <select value={draft.visibility ?? 'PUBLIC'} onChange={(event) => onChange({ ...draft, visibility: event.target.value as BuilderProjectPayload['visibility'] })}>
            <option value="PUBLIC">공개</option>
            <option value="PRIVATE">비공개</option>
            <option value="DRAFT">초안</option>
          </select>
        </label>
      </div>
      <label className="field">
        <span>기술 스택</span>
        <input value={(draft.techStacks ?? []).join(', ')} onChange={(event) => onChange({ ...draft, techStacks: csvToArray(event.target.value) })} />
      </label>
      <label className="field">
        <span>GitHub 링크</span>
        <input value={draft.githubUrl ?? ''} onChange={(event) => onChange({ ...draft, githubUrl: event.target.value })} />
      </label>
      <label className="field">
        <span>배포 링크</span>
        <input value={draft.liveUrl ?? ''} onChange={(event) => onChange({ ...draft, liveUrl: event.target.value })} />
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
