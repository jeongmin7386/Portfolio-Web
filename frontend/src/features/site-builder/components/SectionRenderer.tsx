import type { CSSProperties, ReactNode } from 'react';
import { defaultSectionStyles } from '../blockCatalog';
import type { SiteSection } from '../types';

type SectionRendererProps = {
  section: SiteSection;
  selected: boolean;
  children: ReactNode;
  onSelect: (sectionId: string) => void;
};

function sectionStyle(section: SiteSection): CSSProperties {
  const styles = {
    ...defaultSectionStyles(),
    ...(section.styles ?? {})
  };

  return {
    position: 'relative',
    minHeight: styles.minHeight,
    padding: styles.padding,
    backgroundColor: styles.backgroundColor,
    backgroundImage: styles.backgroundImage ? `url("${styles.backgroundImage}")` : undefined,
    backgroundSize: styles.backgroundSize,
    backgroundPosition: styles.backgroundPosition,
    overflow: 'hidden'
  };
}

export function SectionRenderer({ section, selected, children, onSelect }: SectionRendererProps) {
  const overlayColor = section.styles?.overlayColor;

  return (
    <section
      className={`editor-section-renderer ${selected ? 'selected' : ''}`}
      style={sectionStyle(section)}
      onClick={(event) => {
        if (event.currentTarget === event.target) {
          onSelect(section.id);
        }
      }}
    >
      {overlayColor && overlayColor !== 'rgba(0,0,0,0)' ? <div className="editor-section-overlay" style={{ background: overlayColor }} /> : null}
      <div className="editor-section-label">{section.name}</div>
      <div className="editor-section-content">{children}</div>
    </section>
  );
}
