import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { BlockRenderer } from '../../features/site-builder/components/BlockRenderer';
import { getPublicBuilderProject } from '../../features/site-builder/siteBuilderApi';
import { assetUrl, getApiErrorMessage } from '../../lib/apiClient';

export function SiteBuilderProjectDetailPage() {
  const { siteSlug, projectSlug } = useParams();
  const projectQuery = useQuery({
    queryKey: ['publicBuilderProject', siteSlug, projectSlug],
    queryFn: () => getPublicBuilderProject(projectSlug!, siteSlug),
    enabled: Boolean(projectSlug)
  });

  useEffect(() => {
    if (projectQuery.data?.project.title) {
      document.title = `${projectQuery.data.project.title} | 프로젝트`;
    }
  }, [projectQuery.data?.project.title]);

  if (projectQuery.isLoading) {
    return <div className="center-screen">프로젝트 상세 페이지를 불러오는 중입니다...</div>;
  }

  if (projectQuery.isError || !projectQuery.data) {
    return <div className="center-screen">{getApiErrorMessage(projectQuery.error, '프로젝트를 찾을 수 없습니다.')}</div>;
  }

  const { project, blocks } = projectQuery.data;

  return (
    <main className="site-public-page">
      <header className="project-public-hero">
        <nav className="site-public-nav">
          <Link to={siteSlug ? `/site/${siteSlug}` : '/site'} className="site-public-brand">
            포트폴리오로 돌아가기
          </Link>
          <div>
            {project.githubUrl ? (
              <a href={project.githubUrl} target="_blank" rel="noreferrer">
                GitHub
              </a>
            ) : null}
            {project.liveUrl ? (
              <a href={project.liveUrl} target="_blank" rel="noreferrer">
                배포 사이트
              </a>
            ) : null}
          </div>
        </nav>

        <div className="project-public-hero-grid">
          <div>
            {project.category ? <p className="eyebrow">{project.category}</p> : null}
            <h1>{project.title}</h1>
            {project.subtitle ? <h2>{project.subtitle}</h2> : null}
            {project.summary ? <p>{project.summary}</p> : null}
            <dl className="project-public-meta">
              <div>
                <dt>기간</dt>
                <dd>{project.period || '-'}</dd>
              </div>
              <div>
                <dt>역할</dt>
                <dd>{project.role || '-'}</dd>
              </div>
              <div>
                <dt>카테고리</dt>
                <dd>{project.category || '-'}</dd>
              </div>
              <div>
                <dt>기여도</dt>
                <dd>{project.contribution || '-'}</dd>
              </div>
            </dl>
          </div>
          <div className="site-public-cover">
            {project.thumbnailUrl ? (
              <img src={assetUrl(project.thumbnailUrl)} alt="" />
            ) : (
              <div>
                <strong>{project.title}</strong>
                <span>{project.techStacks.join(' · ')}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="site-public-section project-public-block-section">
        {project.description ? <p className="builder-project-description">{project.description}</p> : null}
        <div className="site-public-blocks">
          {blocks
            .filter((block) => block.visible)
            .map((block) => (
              <BlockRenderer key={block.id} block={block} />
            ))}
        </div>
      </section>
    </main>
  );
}
