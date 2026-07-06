import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { BlockRenderer } from '../../features/site-builder/components/BlockRenderer';
import { getPublicSite } from '../../features/site-builder/siteBuilderApi';
import type { PageType } from '../../features/site-builder/types';
import { assetUrl, getApiErrorMessage } from '../../lib/apiClient';

const pageTypeLabels: Record<PageType, string> = {
  HOME: '홈',
  PROJECTS: '프로젝트',
  PROJECT_DETAIL: '프로젝트 상세',
  ABOUT: '소개',
  CONTACT: '연락',
  COLLECTION: '컬렉션',
  CUSTOM: '페이지'
};

export function SiteBuilderPublicPage() {
  const { siteSlug } = useParams();
  const siteQuery = useQuery({
    queryKey: ['publicSite', siteSlug],
    queryFn: () => getPublicSite(siteSlug)
  });

  useEffect(() => {
    if (siteQuery.data?.site.title) {
      document.title = `${siteQuery.data.site.title} | 포트폴리오`;
    }
  }, [siteQuery.data?.site.title]);

  if (siteQuery.isLoading) {
    return <div className="center-screen">공개 포트폴리오를 불러오는 중입니다...</div>;
  }

  if (siteQuery.isError || !siteQuery.data) {
    return <div className="center-screen">{getApiErrorMessage(siteQuery.error, '공개 포트폴리오를 찾을 수 없습니다.')}</div>;
  }

  const { site, pages } = siteQuery.data;
  const navPages = pages.filter(({ page }) => page.navVisible);
  const heroPage = pages[0];

  return (
    <main className="site-public-page">
      <header className="site-public-hero">
        <nav className="site-public-nav">
          <Link to="/builder" className="site-public-brand">
            {site.title}
          </Link>
          <div>
            {navPages.map(({ page }) => (
              <a key={page.id} href={`#${page.slug}`}>
                {page.title}
              </a>
            ))}
          </div>
        </nav>

        <div className="site-public-hero-grid">
          <div>
            <p className="eyebrow">포트폴리오 웹사이트</p>
            <h1>{site.title}</h1>
            {site.description ? <p>{site.description}</p> : null}
          </div>
          <div className="site-public-cover">
            {site.profileImageUrl ? (
              <img src={assetUrl(site.profileImageUrl)} alt="" />
            ) : (
              <div>
                <strong>{heroPage?.page.title ?? 'Portfolio'}</strong>
                <span>Visual portfolio</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {pages.map(({ page, blocks }) => (
        <section key={page.id} id={page.slug} className="site-public-section">
          <div className="site-public-section-heading">
            <p className="eyebrow">{pageTypeLabels[page.pageType]}</p>
            <h2>{page.title}</h2>
          </div>
          <div className="site-public-blocks">
            {blocks.map((block) => (
              <BlockRenderer key={block.id} block={block} />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
