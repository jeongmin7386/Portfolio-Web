import { Link } from 'react-router-dom';
import { TemplatePreviewCard } from '../../templates/TemplatePreviewCard';
import { portfolioTemplates } from '../../templates/portfolioTemplates';

const examplePortfolios = [
  {
    title: 'Product Designer',
    category: 'Case studies',
    imageUrl: 'https://images.unsplash.com/photo-1545235617-9465d2a55698?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Frontend Engineer',
    category: 'Live builds',
    imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Photo Series',
    category: 'Image grid',
    imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80'
  }
];

export function LandingPage() {
  return (
    <main className="landing-page">
      <section className="landing-hero">
        <nav className="landing-nav">
          <Link to="/" className="brand-mark">
            Canvasfolio
          </Link>
          <div>
            <Link to="/login">Log in</Link>
            <Link className="button button-primary" to="/signup">
              Start building
            </Link>
          </div>
        </nav>
        <div className="hero-content">
          <p className="eyebrow">Portfolio Website Builder</p>
          <h1>Canvasfolio</h1>
          <p>
            Design a clean visual portfolio, manage project galleries, preview your site, and publish a public page from one
            focused studio.
          </p>
          <div className="action-row">
            <Link className="button button-primary" to="/signup">
              Create portfolio
            </Link>
            <Link className="button button-secondary" to="/login">
              Open studio
            </Link>
          </div>
        </div>
      </section>

      <section className="landing-section template-section">
        <div className="section-heading">
          <p className="eyebrow">Templates</p>
          <h2>Start from a portfolio layout, not a blank document.</h2>
        </div>
        <div className="template-grid">
          {portfolioTemplates.map((template) => (
            <TemplatePreviewCard key={template.id} template={template} />
          ))}
        </div>
      </section>

      <section className="landing-section feature-band">
        <div className="feature-copy">
          <p className="eyebrow">Studio workflow</p>
          <h2>Gallery, preview, design settings, publish.</h2>
          <p>
            The dashboard is organized around your portfolio site: project gallery, template selection, live preview canvas,
            and visual controls for color, typography, spacing, backgrounds, and buttons.
          </p>
        </div>
        <div className="feature-grid">
          {['Template selection', 'Project gallery', 'Live preview canvas', 'Design inspector'].map((feature, index) => (
            <article key={feature}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{feature}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <div className="section-heading">
          <p className="eyebrow">Examples</p>
          <h2>Image-led portfolios for different creative practices.</h2>
        </div>
        <div className="example-grid">
          {examplePortfolios.map((example) => (
            <article key={example.title} className="example-card">
              <img src={example.imageUrl} alt="" />
              <div>
                <p>{example.category}</p>
                <h3>{example.title}</h3>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-cta">
        <p className="eyebrow">Publish ready</p>
        <h2>Turn projects into a portfolio website that feels designed.</h2>
        <Link className="button button-primary" to="/signup">
          Build your site
        </Link>
      </section>
    </main>
  );
}
