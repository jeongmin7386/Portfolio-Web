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
          <p className="eyebrow">Portfolio Studio</p>
          <h1>Design and publish your portfolio website.</h1>
          <p>
            Manage your project gallery, choose a template, open the visual editor, and keep an eye on publishing status from one
            dashboard.
          </p>
        </div>
        <div className="studio-hero-actions">
          <Link className="button button-primary" to="/dashboard/projects/new">
            New portfolio project
          </Link>
          {profile && (
            <Link className="button button-secondary" to={`/${profile.slug}`} target="_blank">
              View live site
            </Link>
          )}
        </div>
      </div>

      <div className="studio-overview-grid">
        <article className="portfolio-site-card">
          <div>
            <p className="eyebrow">My portfolio</p>
            <h2>{profile?.displayName ?? 'Portfolio website'}</h2>
            <p>{profile?.bio || 'A visual portfolio site powered by your project gallery.'}</p>
          </div>
          <div className="status-stack">
            <span className={`status-pill ${profile?.publicProfile ? 'status-public' : 'status-private'}`}>
              {profile?.publicProfile ? 'Published' : 'Private'}
            </span>
            <span>{profile ? `/${profile.slug}` : 'Loading URL'}</span>
          </div>
        </article>

        <article className="metric-card">
          <span>{stats.total}</span>
          <p>Total projects</p>
        </article>
        <article className="metric-card">
          <span>{stats.published}</span>
          <p>Published</p>
        </article>
        <article className="metric-card">
          <span>{stats.private}</span>
          <p>Private or draft</p>
        </article>
      </div>

      <section className="dashboard-band">
        <div className="section-heading compact-heading">
          <div>
            <p className="eyebrow">Template selection</p>
            <h2>Current visual direction</h2>
          </div>
          <Link className="button button-secondary" to="/dashboard/settings">
            Choose template
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
            <p className="eyebrow">Project gallery</p>
            <h2>Work shown on your website</h2>
          </div>
          <Link className="button button-primary" to="/dashboard/projects/new">
            Add project
          </Link>
        </div>

        {projectsQuery.isLoading && <p className="muted">Loading your project gallery...</p>}
        {projects.length === 0 && !projectsQuery.isLoading && (
          <div className="empty-state">
            <h2>Create the first gallery item</h2>
            <p>Add a project with a cover image, stack, links, and case study body.</p>
            <Link className="button button-primary" to="/dashboard/projects/new">
              New portfolio project
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
