import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getProfile } from '../../features/auth/profileApi';
import { ProjectGalleryCard } from '../../features/project-management/ProjectGalleryCard';
import { deleteProject, listProjects } from '../../features/projects/projectApi';
import { TemplatePreviewCard } from '../../templates/TemplatePreviewCard';
import { findPortfolioTemplate, portfolioTemplates } from '../../templates/portfolioTemplates';

export function ProjectListPage() {
  const queryClient = useQueryClient();
  const projectsQuery = useQuery({ queryKey: ['projects'], queryFn: listProjects });
  const profileQuery = useQuery({ queryKey: ['profile'], queryFn: getProfile });
  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] })
  });

  const projects = projectsQuery.data ?? [];
  const profile = profileQuery.data;
  const currentTemplate = findPortfolioTemplate(profile?.theme);
  const stats = useMemo(
    () => ({
      total: projects.length,
      published: projects.filter((project) => project.visibility === 'PUBLIC').length,
      private: projects.filter((project) => project.visibility !== 'PUBLIC').length
    }),
    [projects]
  );

  return (
    <section className="studio-page">
      <div className="studio-hero-panel">
        <div>
          <p className="eyebrow">포트폴리오 스튜디오</p>
          <h1>내 포트폴리오 웹사이트를 디자인하고 게시하세요.</h1>
          <p>
            프로젝트 갤러리, 템플릿 선택, 비주얼 에디터, 게시 상태를 한 화면에서 관리할 수 있습니다.
          </p>
        </div>
        <div className="studio-hero-actions">
          <Link className="button button-primary" to="/dashboard/projects/new">
            새 프로젝트 추가
          </Link>
          {profile && (
            <Link className="button button-secondary" to={`/${profile.slug}`} target="_blank">
              공개 사이트 보기
            </Link>
          )}
        </div>
      </div>

      <div className="studio-overview-grid">
        <article className="portfolio-site-card">
          <div>
            <p className="eyebrow">내 포트폴리오</p>
            <h2>{profile?.displayName ?? '포트폴리오 웹사이트'}</h2>
            <p>{profile?.bio || '프로젝트 갤러리를 중심으로 구성되는 나만의 포트폴리오 사이트입니다.'}</p>
          </div>
          <div className="status-stack">
            <span className={`status-pill ${profile?.publicProfile ? 'status-public' : 'status-private'}`}>
              {profile?.publicProfile ? '게시됨' : '비공개'}
            </span>
            <span>{profile ? `/${profile.slug}` : '주소 불러오는 중'}</span>
          </div>
        </article>

        <article className="metric-card">
          <span>{stats.total}</span>
          <p>전체 프로젝트</p>
        </article>
        <article className="metric-card">
          <span>{stats.published}</span>
          <p>게시됨</p>
        </article>
        <article className="metric-card">
          <span>{stats.private}</span>
          <p>비공개/초안</p>
        </article>
      </div>

      <section className="dashboard-band">
        <div className="section-heading compact-heading">
          <div>
            <p className="eyebrow">템플릿 선택</p>
            <h2>현재 사이트 분위기</h2>
          </div>
          <Link className="button button-secondary" to="/dashboard/settings">
            템플릿 고르기
          </Link>
        </div>
        <div className="template-strip">
          <TemplatePreviewCard template={currentTemplate} selected />
          {portfolioTemplates
            .filter((template) => template.id !== currentTemplate.id)
            .slice(0, 2)
            .map((template) => (
              <TemplatePreviewCard key={template.id} template={template} compact />
            ))}
        </div>
      </section>

      <section className="dashboard-band">
        <div className="section-heading compact-heading">
          <div>
            <p className="eyebrow">프로젝트 갤러리</p>
            <h2>웹사이트에 보여줄 작업</h2>
          </div>
          <Link className="button button-primary" to="/dashboard/projects/new">
            프로젝트 추가
          </Link>
        </div>

        {projectsQuery.isLoading && <p className="muted">프로젝트 갤러리를 불러오는 중입니다...</p>}
        {projects.length === 0 && !projectsQuery.isLoading && (
          <div className="empty-state">
            <h2>첫 번째 프로젝트를 추가해보세요</h2>
            <p>커버 이미지, 사용 기술, 링크, 케이스 스터디 본문을 넣어 포트폴리오 갤러리를 채울 수 있습니다.</p>
            <Link className="button button-primary" to="/dashboard/projects/new">
              새 프로젝트 추가
            </Link>
          </div>
        )}

        <div className="studio-project-grid">
          {projects.map((project) => (
            <ProjectGalleryCard key={project.id} project={project} onDelete={(projectId) => deleteMutation.mutate(projectId)} />
          ))}
        </div>
      </section>
    </section>
  );
}
