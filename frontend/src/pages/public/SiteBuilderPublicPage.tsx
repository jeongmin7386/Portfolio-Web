import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { PublicBlockCanvas } from '../../features/site-builder/components/PublicBlockCanvas';
import { getPublicSite } from '../../features/site-builder/siteBuilderApi';
import { assetUrl, getApiErrorMessage } from '../../lib/apiClient';

export function SiteBuilderPublicPage() {
  const { siteSlug } = useParams();
  const siteQuery = useQuery({
    queryKey: ['publicSite', siteSlug],
    queryFn: () => getPublicSite(siteSlug)
  });

  useEffect(() => {
    const firstPage = siteQuery.data?.pages[0]?.page;
    if (firstPage?.seoTitle || siteQuery.data?.site.title) {
      document.title = firstPage?.seoTitle || siteQuery.data!.site.title;
    }
    setMeta('name', 'description', firstPage?.seoDescription ?? siteQuery.data?.site.description ?? '');
    setMeta('property', 'og:image', firstPage?.seoOgImage ?? '');
  }, [siteQuery.data]);

  if (siteQuery.isLoading) {
    return <div className="center-screen">공개 사이트를 불러오는 중입니다...</div>;
  }

  if (siteQuery.isError || !siteQuery.data) {
    return <div className="center-screen">{getApiErrorMessage(siteQuery.error, '공개 사이트를 찾을 수 없습니다.')}</div>;
  }

  const { site, pages, projects } = siteQuery.data;
  const navPages = pages.filter(({ page }) => page.navVisible);
  const projectBasePath = siteSlug ? `/site/${siteSlug}/projects` : '/site/projects';

  return (
    <main className="site-public-page">
      <header className="site-public-minimal-header">
        <Link to="/builder" className="site-public-brand">
          {site.title}
        </Link>
        <nav>
          {navPages.map(({ page }) => (
            <a key={page.id} href={`#${page.slug}`}>
              {page.title}
            </a>
          ))}
          {projects.length ? <a href="#projects">Projects</a> : null}
        </nav>
      </header>

      {pages.map(({ page, blocks }) => (
        <section key={page.id} id={page.slug} className="site-public-page-blocks">
          <PublicBlockCanvas blocks={blocks} sections={page.sections} />
        </section>
      ))}

      {projects.length ? (
        <section id="projects" className="site-public-project-section">
          <div className="site-public-project-grid">
            {projects.map((project) => (
              <Link key={project.id} to={`${projectBasePath}/${project.slug}`} className="site-public-project-card">
                <div className="site-public-project-thumb">
                  {project.thumbnailUrl ? <img src={assetUrl(project.thumbnailUrl)} alt="" /> : <span>{project.title}</span>}
                </div>
                <div>
                  {project.category ? <p>{project.category}</p> : null}
                  <h3>{project.title}</h3>
                  {project.summary ? <span>{project.summary}</span> : null}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function setMeta(attribute: 'name' | 'property', key: string, value: string) {
  let element = document.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null;
  if (!value) {
    element?.remove();
    return;
  }
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = value;
}
