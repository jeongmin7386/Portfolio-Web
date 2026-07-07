import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { PublicBlockCanvas } from '../../features/site-builder/components/PublicBlockCanvas';
import { getPublicBuilderProject } from '../../features/site-builder/siteBuilderApi';
import { getApiErrorMessage } from '../../lib/apiClient';

export function SiteBuilderProjectDetailPage() {
  const { siteSlug, projectSlug } = useParams();
  const projectQuery = useQuery({
    queryKey: ['publicBuilderProject', siteSlug, projectSlug],
    queryFn: () => getPublicBuilderProject(projectSlug!, siteSlug),
    enabled: Boolean(projectSlug)
  });

  useEffect(() => {
    if (projectQuery.data?.project.title) {
      document.title = projectQuery.data.project.seoTitle || projectQuery.data.project.title;
    }
    setMeta('name', 'description', projectQuery.data?.project.seoDescription ?? projectQuery.data?.project.summary ?? '');
  }, [projectQuery.data?.project]);

  if (projectQuery.isLoading) {
    return <div className="center-screen">프로젝트를 불러오는 중입니다...</div>;
  }

  if (projectQuery.isError || !projectQuery.data) {
    return <div className="center-screen">{getApiErrorMessage(projectQuery.error, '프로젝트를 찾을 수 없습니다.')}</div>;
  }

  const { project, blocks } = projectQuery.data;

  return (
    <main className="site-public-page">
      <header className="site-public-minimal-header">
        <Link to={siteSlug ? `/site/${siteSlug}` : '/site'} className="site-public-brand">
          Back
        </Link>
        <nav>
          {project.githubUrl ? (
            <a href={project.githubUrl} target="_blank" rel="noreferrer">
              GitHub
            </a>
          ) : null}
          {project.liveUrl ? (
            <a href={project.liveUrl} target="_blank" rel="noreferrer">
              Live
            </a>
          ) : null}
        </nav>
      </header>
      <PublicBlockCanvas blocks={blocks} />
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
