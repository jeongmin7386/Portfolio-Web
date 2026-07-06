import type { PortfolioTemplate } from './portfolioTemplates';

type TemplatePreviewCardProps = {
  template: PortfolioTemplate;
  compact?: boolean;
  selected?: boolean;
  onSelect?: (templateId: string) => void;
};

export function TemplatePreviewCard({ template, compact = false, selected = false, onSelect }: TemplatePreviewCardProps) {
  const content = (
    <>
      <div className="template-image">
        <img src={template.imageUrl} alt="" />
        <span>{template.layout}</span>
      </div>
      <div className="template-body">
        <div className="template-title-row">
          <h3>{template.name}</h3>
          <span style={{ background: template.accent }} />
        </div>
        {!compact && <p>{template.description}</p>}
        <small>{template.tagline}</small>
      </div>
    </>
  );

  if (onSelect) {
    return (
      <button type="button" className={`template-card ${selected ? 'active' : ''}`} onClick={() => onSelect(template.id)}>
        {content}
      </button>
    );
  }

  return <article className={`template-card ${selected ? 'active' : ''}`}>{content}</article>;
}
