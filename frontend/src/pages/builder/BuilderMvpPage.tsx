import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { queryClient } from '../../app/queryClient';
import {
  blockLabel,
  defaultBlockContent,
  defaultBlockLayout,
  defaultBlockStyles,
  defaultSection
} from '../../features/site-builder/blockCatalog';
import { AddBlockModal } from '../../features/site-builder/components/AddBlockModal';
import { EditorCanvas } from '../../features/site-builder/components/EditorCanvas';
import { RightInspectorPanel } from '../../features/site-builder/components/RightInspectorPanel';
import { SectionRenderer } from '../../features/site-builder/components/SectionRenderer';
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
  savePageBlocks,
  saveProjectBlocks,
  updateBuilderProject,
  updatePage,
  updateSite
} from '../../features/site-builder/siteBuilderApi';
import type {
  BlockLayout,
  BlockPayload,
  BlockType,
  BuilderProject,
  BuilderProjectPayload,
  DeviceMode,
  PagePayload,
  SiteSection,
  SiteBlock,
  SitePage
} from '../../features/site-builder/types';
import { getApiErrorMessage } from '../../lib/apiClient';

type SelectedTarget = {
  type: 'page' | 'project';
  id: number | null;
};

type BlockDraftMap = Record<number, SiteBlock>;

type CreateBlockInput = {
  type: BlockType;
  source?: SiteBlock;
};

const defaultBlockSettings = {
  width: 'normal',
  align: 'left',
  paddingTop: 0,
  paddingBottom: 0,
  locked: false
};

const devices: DeviceMode[] = ['desktop', 'tablet', 'mobile'];

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
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [addBlockOpen, setAddBlockOpen] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState('section-main');

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

  const draftBlocks = useMemo(() => {
    const merged = new Map<number, SiteBlock>();
    serverBlocks.forEach((block) => merged.set(block.id, block));
    Object.values(blockDrafts).forEach((block) => merged.set(block.id, block));
    return [...merged.values()]
      .filter((block) =>
        selectedTarget.type === 'project'
          ? block.projectId === selectedProject?.id
          : block.pageId === selectedPage?.id
      )
      .sort((first, second) => first.sortOrder - second.sortOrder);
  }, [blockDrafts, selectedPage?.id, selectedProject?.id, selectedTarget.type, serverBlocks]);

  const selectedBlock = selectedBlockId ? draftBlocks.find((block) => block.id === selectedBlockId) ?? null : null;
  const editorSections = useMemo(
    () => normalizeEditorSections(selectedTarget.type === 'page' ? pageDraft?.sections : undefined, draftBlocks, selectedPage?.id),
    [draftBlocks, pageDraft?.sections, selectedPage?.id, selectedTarget.type]
  );
  const selectedSection = editorSections.find((section) => section.id === selectedSectionId) ?? editorSections[0];
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
  }, [
    selectedPage?.id,
    selectedPage?.title,
    selectedPage?.slug,
    selectedPage?.publicPage,
    selectedPage?.navVisible,
    selectedPage?.sortOrder,
    selectedPage?.seoTitle,
    selectedPage?.seoDescription,
    selectedPage?.seoOgImage,
    selectedPage?.sections
  ]);

  useEffect(() => {
    if (selectedProject) {
      setProjectDraft(projectToPayload(selectedProject));
    }
  }, [selectedProject?.id, selectedProject?.title, selectedProject?.slug, selectedProject?.sortOrder]);

  useEffect(() => {
    const nextDrafts = serverBlocks.reduce<BlockDraftMap>((drafts, block) => {
      drafts[block.id] = withRenderableDefaults(block);
      return drafts;
    }, {});
    setBlockDrafts(nextDrafts);
    setSelectedBlockId((current) => (current && serverBlocks.some((block) => block.id === current) ? current : serverBlocks[0]?.id ?? null));
  }, [selectedTarget.type, selectedPage?.id, selectedProject?.id, serverBlocks]);

  useEffect(() => {
    if (!editorSections.some((section) => section.id === selectedSectionId)) {
      setSelectedSectionId(editorSections[0]?.id ?? 'section-main');
    }
  }, [editorSections, selectedSectionId]);

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
    mutationFn: ({ type, source }: CreateBlockInput) => {
      const payload = createBlockPayload(type, draftBlocks.length, selectedSectionId, source);
      console.log('[builder:create-freeform-block-request]', payload);
      if (selectedTarget.type === 'project' && selectedProject) {
        return createProjectBlock(selectedProject.id, payload);
      }
      if (selectedPage) {
        return createBlock(selectedPage.id, payload);
      }
      throw new Error('No selected target');
    },
    onSuccess: (block) => {
      const next = withRenderableDefaults(block);
      console.log('[builder:create-freeform-block-success]', next);
      setSelectedBlockId(next.id);
      setBlockDrafts((current) => ({ ...current, [next.id]: next }));
      invalidateSelectedTarget(selectedTarget);
    }
  });

  const saveBlocksMutation = useMutation({
    mutationFn: ({ target, pageId, projectId, blocks }: { target: SelectedTarget; pageId?: number; projectId?: number; blocks: SiteBlock[] }) => {
      const payload = blocks.map((block, index) => blockToPayload({ ...block, sortOrder: index }));
      console.log('[builder:save-blocks-request]', { target, pageId, projectId, payload });
      if (target.type === 'project') {
        if (!projectId) {
          throw new Error('No selected project');
        }
        return saveProjectBlocks(projectId, payload);
      }
      if (!pageId) {
        throw new Error('No selected page');
      }
      return savePageBlocks(pageId, payload);
    },
    onSuccess: (blocks) => {
      console.log('[builder:save-blocks-success]', blocks);
      setBlockDrafts(blocks.reduce<BlockDraftMap>((drafts, block) => {
        drafts[block.id] = withRenderableDefaults(block);
        return drafts;
      }, {}));
      invalidateSelectedTarget(selectedTarget);
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

  const deleteBlockMutation = useMutation({
    mutationFn: (block: SiteBlock) => (block.projectId ? deleteProjectBlock(block.projectId, block.id) : deleteBlock(block.pageId!, block.id)),
    onSuccess: (_, block) => {
      console.log('[builder:delete-block-success]', block.id);
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

  function replaceBlockDraft(block: SiteBlock) {
    const next = withRenderableDefaults(block);
    console.log('[builder:block-draft-change]', next);
    setSelectedBlockId(next.id);
    setBlockDrafts((current) => ({ ...current, [next.id]: next }));
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
      sortOrder: pages.length,
      sections: [defaultSection('section-main', 'Main Section', 0)]
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

  function handleSaveBlocks() {
    saveBlocksMutation.mutate({
      target: selectedTarget,
      pageId: selectedPage?.id,
      projectId: selectedProject?.id,
      blocks: draftBlocks
    });
  }

  function handleSaveCurrentDrafts() {
    console.log('[builder:save-current-drafts]', {
      selectedTarget,
      site: { title: siteTitle, description: siteDescription },
      pageDraft,
      projectDraft,
      blocks: draftBlocks
    });
    handleSaveSite();
    if (selectedTarget.type === 'page') {
      handleSavePage();
    }
    if (selectedTarget.type === 'project') {
      handleSaveProject();
    }
    handleSaveBlocks();
  }

  function handleBringForward(block: SiteBlock) {
    replaceBlockDraft(updateFrame(block, deviceMode, (frame) => ({ ...frame, zIndex: frame.zIndex + 1 })));
  }

  function handleSendBackward(block: SiteBlock) {
    replaceBlockDraft(updateFrame(block, deviceMode, (frame) => ({ ...frame, zIndex: Math.max(0, frame.zIndex - 1) })));
  }

  function handleToggleLock(block: SiteBlock) {
    replaceBlockDraft({ ...block, settings: { ...(block.settings ?? {}), locked: !block.settings?.locked } });
  }

  function handleAddSection() {
    const nextSection = defaultSection(`section-${Date.now()}`, `Section ${editorSections.length + 1}`, editorSections.length);
    setSelectedSectionId(nextSection.id);
    if (selectedTarget.type === 'page') {
      patchPage('sections', [...editorSections, nextSection]);
    }
  }

  function patchSection(nextSection: SiteSection) {
    setSelectedSectionId(nextSection.id);
    if (selectedTarget.type !== 'page') {
      return;
    }
    patchPage(
      'sections',
      editorSections.map((section) => (section.id === nextSection.id ? nextSection : section))
    );
  }

  function blocksForSection(sectionId: string) {
    return draftBlocks.filter((block) => blockSectionId(block) === sectionId);
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
    updateSiteMutation.isPending || updatePageMutation.isPending || updateProjectMutation.isPending || saveBlocksMutation.isPending;

  return (
    <>
      <main className="builder-mvp-page">
        <aside className="builder-page-panel">
          <div className="builder-brand">
            <p className="eyebrow">Freeform site builder</p>
            <h1>캔버스폴리오</h1>
            <span>모든 블록을 선택, 이동, 크기 조절, 편집할 수 있는 포트폴리오 빌더입니다.</span>
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
              <p className="eyebrow">{selectedTarget.type === 'project' ? '프로젝트 상세 캔버스' : '페이지 캔버스'}</p>
              <h2>{previewTitle}</h2>
            </div>
            <div className="action-row">
              <div className="device-switcher" aria-label="디바이스 미리보기">
                {devices.map((device) => (
                  <button key={device} type="button" className={deviceMode === device ? 'active' : ''} onClick={() => setDeviceMode(device)}>
                    {device}
                  </button>
                ))}
              </div>
              <label className={`toggle ${snapToGrid ? 'toggle-on' : ''}`}>
                <input type="checkbox" checked={snapToGrid} onChange={(event) => setSnapToGrid(event.target.checked)} />
                <span className="toggle-track"><span className="toggle-thumb" /></span>
                그리드 스냅
              </label>
              <button className="button button-secondary" type="button" onClick={() => setAddBlockOpen(true)}>
                + 블록
              </button>
              <Link className="button button-secondary" to={publicPreviewUrl} target="_blank">
                공개 페이지 보기
              </Link>
              <button className="button button-primary" type="button" onClick={handleSaveCurrentDrafts} disabled={isSavingCurrent}>
                {isSavingCurrent ? '저장 중...' : '저장 / 게시'}
              </button>
            </div>
          </header>

          <article className="builder-site-preview freeform-preview-shell">
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
            {editorSections.map((section) => (
              <SectionRenderer
                key={section.id}
                section={section}
                selected={selectedSection?.id === section.id}
                onSelect={(sectionId) => {
                  setSelectedSectionId(sectionId);
                  setSelectedBlockId(null);
                }}
              >
                <EditorCanvas
                  blocks={blocksForSection(section.id)}
                  selectedBlockId={selectedBlockId}
                  device={deviceMode}
                  snapToGrid={snapToGrid}
                  onSelect={(blockId) => {
                    setSelectedSectionId(section.id);
                    setSelectedBlockId(blockId);
                  }}
                  onChange={replaceBlockDraft}
                  onDuplicate={(block) => createBlockMutation.mutate({ type: block.blockType, source: block })}
                  onDelete={(block) => deleteBlockMutation.mutate(block)}
                  onBringForward={handleBringForward}
                  onSendBackward={handleSendBackward}
                  onToggleLock={handleToggleLock}
                  onOpenAddBlock={() => {
                    setSelectedSectionId(section.id);
                    setAddBlockOpen(true);
                  }}
                />
              </SectionRenderer>
            ))}
            <button className="section-add-button" type="button" onClick={handleAddSection}>
              + 섹션 추가
            </button>
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

          {selectedSection ? (
            <SectionSettingsPanel
              section={selectedSection}
              readOnly={selectedTarget.type !== 'page'}
              onPatch={patchSection}
              onAddSection={handleAddSection}
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

          <section className="inspector-section">
            <div className="block-editor-card-header">
              <div>
                <p className="panel-label">블록 목록</p>
                <h3>{draftBlocks.length}개 객체</h3>
              </div>
              <button className="button button-ghost" type="button" onClick={() => setAddBlockOpen(true)}>
                추가
              </button>
            </div>
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
                  <small>{block.visible ? '공개' : '비공개'} · z {block.layout?.[deviceMode]?.zIndex ?? block.sortOrder + 1}</small>
                </button>
              ))}
            </div>
          </section>

          <RightInspectorPanel
            block={selectedBlock}
            device={deviceMode}
            isSaving={saveBlocksMutation.isPending}
            onChange={replaceBlockDraft}
            onSave={handleSaveBlocks}
            onDelete={(block) => deleteBlockMutation.mutate(block)}
            onDuplicate={(block) => createBlockMutation.mutate({ type: block.blockType, source: block })}
            onBringForward={handleBringForward}
            onSendBackward={handleSendBackward}
            onToggleLock={handleToggleLock}
          />

          {(createPageMutation.isError ||
            updatePageMutation.isError ||
            createProjectMutation.isError ||
            updateProjectMutation.isError ||
            createBlockMutation.isError ||
            saveBlocksMutation.isError) && <p className="form-error">요청을 저장하지 못했습니다. 입력값을 확인해주세요.</p>}
        </aside>
      </main>
      <AddBlockModal
        open={addBlockOpen}
        isAdding={createBlockMutation.isPending}
        onClose={() => setAddBlockOpen(false)}
        onAdd={(type) => createBlockMutation.mutate({ type })}
      />
    </>
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
    seoDescription: page.seoDescription,
    seoOgImage: page.seoOgImage,
    sections: normalizeEditorSections(page.sections, [], page.id)
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
    seoDescription: draft.seoDescription,
    seoOgImage: draft.seoOgImage,
    sections: normalizeEditorSections(draft.sections, [], page.id)
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
      <label className="field">
        <span>OG 이미지 URL</span>
        <input value={draft.seoOgImage ?? ''} onChange={(event) => onPatch('seoOgImage', event.target.value)} />
      </label>
      <button className="button button-primary" type="button" disabled={isSaving} onClick={onSave}>
        {isSaving ? '저장 중...' : '페이지 저장'}
      </button>
    </section>
  );
}

function SectionSettingsPanel({
  section,
  readOnly,
  onPatch,
  onAddSection
}: {
  section: SiteSection;
  readOnly: boolean;
  onPatch: (section: SiteSection) => void;
  onAddSection: () => void;
}) {
  const styles = section.styles ?? {};

  function patch<K extends keyof SiteSection>(field: K, value: SiteSection[K]) {
    onPatch({ ...section, [field]: value });
  }

  function patchStyle(key: keyof SiteSection['styles'], value: string | number) {
    onPatch({
      ...section,
      styles: {
        ...styles,
        [key]: value
      }
    });
  }

  return (
    <section className="inspector-section">
      <div className="block-editor-card-header">
        <div>
          <p className="panel-label">섹션 설정</p>
          <h3>{section.name}</h3>
        </div>
        <button className="button button-ghost" type="button" disabled={readOnly} onClick={onAddSection}>
          추가
        </button>
      </div>
      {readOnly ? <p className="muted">프로젝트 상세는 현재 기본 섹션으로 렌더링됩니다. 블록 위치와 스타일은 저장됩니다.</p> : null}
      <label className="field">
        <span>섹션 이름</span>
        <input disabled={readOnly} value={section.name} onChange={(event) => patch('name', event.target.value)} />
      </label>
      <label className="field">
        <span>배경 이미지 URL</span>
        <input disabled={readOnly} value={styles.backgroundImage ?? ''} onChange={(event) => patchStyle('backgroundImage', event.target.value)} />
      </label>
      <div className="compact-field-grid">
        <label className="field">
          <span>배경색</span>
          <input disabled={readOnly} type="color" value={styles.backgroundColor ?? '#fffdf9'} onChange={(event) => patchStyle('backgroundColor', event.target.value)} />
        </label>
        <label className="field">
          <span>오버레이</span>
          <input disabled={readOnly} value={styles.overlayColor ?? 'rgba(0,0,0,0)'} onChange={(event) => patchStyle('overlayColor', event.target.value)} />
        </label>
      </div>
      <div className="compact-field-grid">
        <label className="field">
          <span>최소 높이</span>
          <input disabled={readOnly} type="number" value={styles.minHeight ?? 720} onChange={(event) => patchStyle('minHeight', Number(event.target.value))} />
        </label>
        <label className="field">
          <span>패딩</span>
          <input disabled={readOnly} type="number" value={styles.padding ?? 80} onChange={(event) => patchStyle('padding', Number(event.target.value))} />
        </label>
      </div>
      <div className="compact-field-grid">
        <label className="field">
          <span>배경 크기</span>
          <select disabled={readOnly} value={styles.backgroundSize ?? 'cover'} onChange={(event) => patchStyle('backgroundSize', event.target.value)}>
            <option value="cover">cover</option>
            <option value="contain">contain</option>
            <option value="auto">auto</option>
          </select>
        </label>
        <label className="field">
          <span>배경 위치</span>
          <input disabled={readOnly} value={styles.backgroundPosition ?? 'center'} onChange={(event) => patchStyle('backgroundPosition', event.target.value)} />
        </label>
      </div>
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

function blockToPayload(block: SiteBlock): BlockPayload {
  return {
    id: block.id,
    blockType: block.blockType,
    sectionId: block.sectionId ?? null,
    content: block.content ?? {},
    settings: block.settings ?? {},
    styles: block.styles ?? {},
    layout: block.layout ?? {},
    visible: block.visible,
    sortOrder: block.sortOrder
  };
}

function createBlockPayload(type: BlockType, index: number, sectionId: string, source?: SiteBlock): BlockPayload {
  const payload: BlockPayload = source
    ? {
        blockType: source.blockType,
        sectionId: source.sectionId ?? sectionId,
        content: cloneRecord(source.content),
        settings: { ...defaultBlockSettings, ...(source.settings ?? {}) },
        styles: { ...defaultBlockStyles(source.blockType), ...(source.styles ?? {}) },
        layout: offsetLayout(source.layout ?? defaultBlockLayout(source.blockType, index), index),
        visible: source.visible,
        sortOrder: index
      }
    : {
        blockType: type,
        sectionId,
        content: defaultBlockContent(type),
        settings: defaultBlockSettings,
        styles: defaultBlockStyles(type),
        layout: defaultBlockLayout(type, index),
        visible: true,
        sortOrder: index
      };
  return payload;
}

function withRenderableDefaults(block: SiteBlock): SiteBlock {
  return {
    ...block,
    sectionId: block.sectionId ?? 'section-main',
    settings: { ...defaultBlockSettings, ...(block.settings ?? {}) },
    styles: { ...defaultBlockStyles(block.blockType), ...(block.styles ?? {}) },
    layout: normalizeLayout(block.blockType, block.sortOrder, block.layout)
  };
}

function normalizeLayout(type: BlockType, index: number, layout?: BlockLayout): BlockLayout {
  const fallback = defaultBlockLayout(type, index);
  return {
    desktop: { ...fallback.desktop!, ...(layout?.desktop ?? {}) },
    tablet: { ...fallback.tablet!, ...(layout?.tablet ?? {}) },
    mobile: { ...fallback.mobile!, ...(layout?.mobile ?? {}) }
  };
}

function updateFrame(block: SiteBlock, device: DeviceMode, updater: (frame: NonNullable<BlockLayout[DeviceMode]>) => NonNullable<BlockLayout[DeviceMode]>): SiteBlock {
  const layout = normalizeLayout(block.blockType, block.sortOrder, block.layout);
  return {
    ...block,
    layout: {
      ...layout,
      [device]: updater(layout[device]!)
    }
  };
}

function offsetLayout(layout: BlockLayout, index: number): BlockLayout {
  const fallback = defaultBlockLayout('TEXT', index);
  return devices.reduce<BlockLayout>((next, device) => {
    const frame = layout[device] ?? fallback[device]!;
    next[device] = {
      ...frame,
      x: frame.x + 32,
      y: frame.y + 32,
      zIndex: index + 1
    };
    return next;
  }, {});
}

function cloneRecord(value: Record<string, unknown> | undefined) {
  return JSON.parse(JSON.stringify(value ?? {})) as Record<string, unknown>;
}

function csvToArray(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function blockSectionId(block: SiteBlock) {
  return block.sectionId || 'section-main';
}

function normalizeEditorSections(sections: SiteSection[] | undefined, blocks: SiteBlock[], pageId?: number): SiteSection[] {
  const normalized: SiteSection[] = (sections?.length ? sections : [defaultSection('section-main', 'Main Section', 0)]).map((section, index) => {
    const fallback = defaultSection(section.id || `section-${index + 1}`, section.name || `Section ${index + 1}`, section.sortOrder ?? index);
    return {
      ...fallback,
      ...section,
      pageId: section.pageId ?? pageId,
      styles: {
        ...fallback.styles,
        ...(section.styles ?? {})
      }
    };
  });
  const seen = new Set(normalized.map((section) => section.id));
  blocks.forEach((block) => {
    const sectionId = blockSectionId(block);
    if (!seen.has(sectionId)) {
      seen.add(sectionId);
      normalized.push(defaultSection(sectionId, sectionId, normalized.length));
    }
  });
  return normalized.sort((first, second) => first.sortOrder - second.sortOrder);
}
