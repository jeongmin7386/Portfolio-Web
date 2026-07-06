import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getPublicProject } from '../../features/projects/publicApi';
import { assetUrl } from '../../lib/apiClient';

export function ProjectDetailPage() {
  const { portfolioSlug, projectSlug } = useParams();
  const projectQuery = useQuery({
    queryKey: ['publicProject', portfolioSlug, projectSlug],
    queryFn: () => getPublicProject(portfolioSlug!, projectSlug!),
    enabled: Boolean(portfolioSlug && projectSlug)
  });

  if (projectQuery.isLoading) {
    return <div className="center-screen">프로젝트를 불러오는 중입니다...</div>;
  }

  if (!projectQuery.data || !portfolioSlug) {
    return <div className="center-screen">프로젝트를 찾을 수 없습니다.</div>;
  }

  const project = projectQuery.data;

  return (
    <main className="project-detail-page">
      <Link className="back-link" to={`/${portfolioSlug}`}>
        포트폴리오로 돌아가기
      </Link>
      <article className="project-detail">
        <div className="detail-hero">
          {project.thumbnailUrl ? <img src={assetUrl(project.thumbnailUrl)} alt="" /> : <span>{project.title}</span>}
        </div>
        <div className="detail-body">
          <p className="eyebrow">{project.category?.name ?? '프로젝트'}</p>
          <h1>{project.title}</h1>
          {project.description && <p className="detail-description">{project.description}</p>}
          <div className="chip-row">
            {project.techStacks.map((stack) => (
              <span key={stack} className="chip">
                {stack}
              </span>
            ))}
          </div>
          <div className="action-row">
            {project.githubUrl && (
              <a className="button button-secondary" href={project.githubUrl} target="_blank" rel="noreferrer">
                GitHub
              </a>
            )}
            {project.liveUrl && (
              <a className="button button-primary" href={project.liveUrl} target="_blank" rel="noreferrer">
                배포 사이트
              </a>
            )}
          </div>
        </div>
      </article>

      {project.caseStudy && (
        <section className="case-study-section">
          <p className="eyebrow">케이스 스터디</p>
          <h2>과정, 의사결정, 결과</h2>
          <p>{project.caseStudy}</p>
        </section>
      )}
    </main>
  );
}
