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
  createPage,
  deleteBlock,
  deletePage,
  getBuilderState,
  getPageWithBlocks,
  updateBlock,
  updatePage,
  updateSite
} from '../../features/site-builder/siteBuilderApi';
import type { BlockType, PagePayload, SiteBlock } from '../../features/site-builder/types';
import { getApiErrorMessage } from '../../lib/apiClient';

export function BuilderMvpPage() {
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [pageDraft, setPageDraft] = useState<PagePayload | null>(null);
  const [siteTitle, setSiteTitle] = useState('');
  const [siteDescription, setSiteDescription] = useState('');

  const stateQuery = useQuery({ queryKey: ['builderState'], queryFn: getBuilderState });
  const pages = stateQuery.data?.pages ?? [];
  const selectedPage = pages.find((page) => page.id === selectedPageId) ?? pages[0];

  const pageQuery = useQuery({
    queryKey: ['builderPage', selectedPage?.id],
    queryFn: () => getPageWithBlocks(selectedPage!.id),
    enabled: Boolean(selectedPage?.id)
  });

  useEffect(() => {
    if (!selectedPageId && pages[0]) {
      setSelectedPageId(pages[0].id);
    }
  }, [pages, selectedPageId]);

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

  const createPageMutation = useMutation({
    mutationFn: createPage,
    onSuccess: (page) => {
      setNewPageTitle('');
      setSelectedPageId(page.id);
      queryClient.invalidateQueries({ queryKey: ['builderState'] });
    }
  });

  const updatePageMutation = useMutation({
    mutationFn: ({ pageId, payload }: { pageId: number; payload: PagePayload }) => updatePage(pageId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['builderState'] })
  });

  const deletePageMutation = useMutation({
    mutationFn: deletePage,
    onSuccess: () => {
      setSelectedPageId(null);
      queryClient.invalidateQueries({ queryKey: ['builderState'] });
    }
  });

  const updateSiteMutation = useMutation({
    mutationFn: updateSite,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['builderState'] })
  });

  const createBlockMutation = useMutation({
    mutationFn: ({ pageId, type }: { pageId: number; type: BlockType }) =>
      createBlock(pageId, { blockType: type, content: defaultBlockContent(type) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['builderPage', selectedPage?.id] })
  });

  const updateBlockMutation = useMutation({
    mutationFn: ({ block, content }: { block: SiteBlock; content: Record<string, unknown> }) =>
      updateBlock(block.pageId, block.id, { blockType: block.blockType, content, sortOrder: block.sortOrder }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['builderPage', selectedPage?.id] })
  });

  const deleteBlockMutation = useMutation({
    mutationFn: (block: SiteBlock) => deleteBlock(block.pageId, block.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['builderPage', selectedPage?.id] })
  });

  const blocks = useMemo(() => pageQuery.data?.blocks ?? [], [pageQuery.data]);

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

  if (stateQuery.isLoading) {
    return <div className="center-screen">사이트 빌더를 준비하는 중입니다...</div>;
  }

  if (stateQuery.isError || !stateQuery.data) {
    return <div className="center-screen">{getApiErrorMessage(stateQuery.error, '사이트 빌더를 불러오지 못했습니다.')}</div>;
  }

  return (
    <main className="builder-mvp-page">
      <aside className="builder-page-panel">
        <div className="builder-brand">
          <p className="eyebrow">블록 사이트 빌더</p>
          <h1>캔버스폴리오</h1>
          <span>페이지와 블록으로 포트폴리오 웹사이트를 만드세요.</span>
        </div>

        <form className="builder-new-page" onSubmit={handleCreatePage}>
          <label className="field">
            <span>새 페이지</span>
            <input value={newPageTitle} onChange={(event) => setNewPageTitle(event.target.value)} placeholder="예: 프로젝트, 소개, 연락" />
          </label>
          <button className="button button-primary" type="submit" disabled={createPageMutation.isPending}>
            페이지 만들기
          </button>
        </form>

        <div className="builder-page-list">
          {pages.map((page) => (
            <button key={page.id} type="button" className={selectedPage?.id === page.id ? 'active' : ''} onClick={() => setSelectedPageId(page.id)}>
              <span>{page.title}</span>
              <small>{page.publicPage ? '공개' : '비공개'} · {page.navVisible ? '메뉴 표시' : '메뉴 숨김'}</small>
            </button>
          ))}
        </div>
      </aside>

      <section className="builder-canvas-panel">
        <header className="builder-toolbar">
          <div>
            <p className="eyebrow">실시간 미리보기</p>
            <h2>{selectedPage?.title ?? '페이지'}</h2>
          </div>
          <div className="action-row">
            <Link className="button button-secondary" to="/site" target="_blank">
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
                  <button key={page.id} type="button" onClick={() => setSelectedPageId(page.id)}>
                    {page.title}
                  </button>
                ))}
            </div>
          </nav>
          <div className="builder-preview-body">
            {blocks.length ? (
              blocks.map((block) => <BlockRenderer key={block.id} block={block} />)
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

        {selectedPage ? (
          <section className="inspector-section">
            <p className="panel-label">블록 추가</p>
            <BlockPalette
              isAdding={createBlockMutation.isPending}
              onAdd={(type) => createBlockMutation.mutate({ pageId: selectedPage.id, type })}
            />
          </section>
        ) : null}

        <section className="inspector-section">
          <p className="panel-label">블록 목록</p>
          {pageQuery.isLoading ? <p className="muted">블록을 불러오는 중입니다...</p> : null}
          {blocks.map((block) => (
            <BlockEditorCard
              key={block.id}
              block={block}
              isSaving={updateBlockMutation.isPending}
              onSave={(content) => updateBlockMutation.mutate({ block, content })}
              onDelete={() => deleteBlockMutation.mutate(block)}
            />
          ))}
          {!blocks.length && !pageQuery.isLoading ? <p className="muted">아직 블록이 없습니다. 제목이나 프로젝트 카드를 추가해보세요.</p> : null}
        </section>

        {(createPageMutation.isError || updatePageMutation.isError || createBlockMutation.isError || updateBlockMutation.isError) && (
          <p className="form-error">요청을 저장하지 못했습니다. 입력값을 확인해주세요.</p>
        )}
      </aside>
    </main>
  );
}
