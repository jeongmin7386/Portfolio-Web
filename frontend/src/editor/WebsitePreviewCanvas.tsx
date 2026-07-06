import { assetUrl } from '../lib/apiClient';
import type { Project } from '../lib/types';
import { findPortfolioTemplate } from '../templates/portfolioTemplates';
import type { ThemeDraft } from '../features/theme-settings/themeSettings';
import type { ProjectDraft } from '../features/project-management/projectDraft';

type WebsitePreviewCanvasProps = {
  draft: ProjectDraft;
  project?: Project;
  profileName?: string;
  profileTheme?: string;
  theme: ThemeDraft;
};

function previewFont(fontFamily: string) {
  if (fontFamily === 'Georgia') {
    return 'Georgia, serif';
  }
  if (fontFamily === 'Mono') {
    return '"SFMono-Regular", Consolas, monospace';
  }
  return 'Inter, ui-sans-serif, system-ui, sans-serif';
}

export function WebsitePreviewCanvas({ draft, project, profileName = 'Your Name', profileTheme, theme }: WebsitePreviewCanvasProps) {
  const template = findPortfolioTemplate(profileTheme);
  const title = draft.title || 'Selected Project';
  const description = draft.description || 'Describe the purpose, audience, and result of this work.';
  const caseStudy =
    draft.caseStudy ||
    'Use the case study area to explain the problem, process, decisions, and measurable outcome behind the project.';
  const thumbnail = project?.thumbnailUrl;

  return (
    <section className="preview-stage">
      <div className="browser-chrome">
        <span />
        <span />
        <span />
        <strong>Live portfolio preview</strong>
      </div>

      <div
        className="site-canvas"
        style={{
          background: theme.background,
          color: theme.background === '#101010' ? '#f8f5ee' : '#111111',
          fontFamily: previewFont(theme.fontFamily),
          gap: `${theme.spacing}px`
        }}
      >
        <header className="canvas-nav">
          <strong>{profileName}</strong>
          <nav>
            <span>Work</span>
            <span>About</span>
            <span>Contact</span>
          </nav>
        </header>

        <section className="canvas-hero">
          <p className="canvas-kicker" style={{ color: theme.accentColor }}>
            {template.name}
          </p>
          <h1>Portfolio website for visual work and product stories.</h1>
          <p>{template.tagline}</p>
        </section>

        <section className="canvas-project-grid">
          <article className="canvas-project-feature">
            <div className="canvas-image">
              {thumbnail ? <img src={assetUrl(thumbnail)} alt="" /> : <img src={template.imageUrl} alt="" />}
            </div>
            <div>
              <p className="canvas-kicker" style={{ color: theme.accentColor }}>
                Featured project
              </p>
              <h2>{title}</h2>
              <p>{description}</p>
              <div className="canvas-tags">
                {(draft.techStacks.length ? draft.techStacks : ['React', 'Spring Boot', 'PostgreSQL']).slice(0, 4).map((stack) => (
                  <span key={stack}>{stack}</span>
                ))}
              </div>
            </div>
          </article>

          <div className="canvas-mini-grid">
            {template.sections.slice(0, 3).map((section, index) => (
              <article key={section}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{section}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="canvas-case-study">
          <p className="canvas-kicker" style={{ color: theme.accentColor }}>
            Case study
          </p>
          <h2>Process and outcome</h2>
          <p>{caseStudy}</p>
          <div className={`canvas-button canvas-button-${theme.buttonStyle.toLowerCase()}`} style={{ borderColor: theme.accentColor }}>
            View project
          </div>
        </section>
      </div>
    </section>
  );
}
