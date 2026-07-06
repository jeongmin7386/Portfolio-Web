import type { CSSProperties, ReactNode } from 'react';
import { assetUrl } from '../../../lib/apiClient';
import type { SiteBlock } from '../types';

type BlockRendererProps = {
  block: SiteBlock;
};

function textValue(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function numberValue(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function listValue(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object') : [];
}

function stringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function blockStyle(block: SiteBlock): CSSProperties {
  const settings = block.settings ?? {};
  const width = textValue(settings.width, 'normal');
  const maxWidthBySetting: Record<string, string> = {
    narrow: '720px',
    normal: '960px',
    wide: '1180px',
    full: 'none'
  };
  const align = textValue(settings.align, 'left') as CSSProperties['textAlign'];
  const shouldCenter = align === 'center' && width !== 'full';
  const style: CSSProperties = {
    maxWidth: maxWidthBySetting[width] ?? maxWidthBySetting.normal,
    width: '100%',
    marginLeft: align === 'right' ? 'auto' : shouldCenter ? 'auto' : undefined,
    marginRight: shouldCenter ? 'auto' : undefined,
    textAlign: align,
    paddingTop: numberValue(settings.paddingTop),
    paddingBottom: numberValue(settings.paddingBottom),
    backgroundColor: textValue(settings.backgroundColor) || undefined,
    fontSize: numberValue(settings.fontSize),
    fontWeight: numberValue(settings.fontWeight) as CSSProperties['fontWeight']
  };
  return style;
}

function renderWithShell(block: SiteBlock, children: ReactNode) {
  return (
    <div className="site-block-shell" style={blockStyle(block)}>
      {children}
    </div>
  );
}

export function BlockRenderer({ block }: BlockRendererProps) {
  const content = block.content ?? {};

  switch (block.blockType) {
    case 'HEADING': {
      const text = textValue(content.text);
      const level = Number(content.level ?? 2);
      if (level <= 1) {
        return renderWithShell(block, <h1 className="site-block-heading site-block-heading-hero">{text}</h1>);
      }
      return renderWithShell(block, <h2 className="site-block-heading">{text}</h2>);
    }
    case 'IMAGE': {
      const imageUrl = textValue(content.imageUrl || content.url);
      return renderWithShell(
        block,
        <figure className="site-block-image">
          {imageUrl ? <img src={assetUrl(imageUrl)} alt={textValue(content.alt)} /> : <div className="image-placeholder" />}
          {content.caption ? <figcaption>{textValue(content.caption)}</figcaption> : null}
        </figure>
      );
    }
    case 'PHOTO_GRID': {
      const images = listValue(content.images);
      const columns = Number(content.columns ?? 3);
      return renderWithShell(
        block,
        <div className="site-photo-grid" style={{ gridTemplateColumns: `repeat(${Math.max(1, Math.min(columns, 4))}, minmax(0, 1fr))`, gap: Number(content.gap ?? 16) }}>
          {images.map((image, index) => {
            const imageUrl = textValue(image.url);
            return (
              <figure key={`${imageUrl}-${index}`}>
                {imageUrl ? <img src={assetUrl(imageUrl)} alt={textValue(image.alt)} /> : <div className="image-placeholder" />}
                {image.caption ? <figcaption>{textValue(image.caption)}</figcaption> : null}
              </figure>
            );
          })}
        </div>
      );
    }
    case 'DIVIDER':
      return renderWithShell(block, <hr className="site-block-divider" />);
    case 'QUOTE':
      return renderWithShell(
        block,
        <blockquote className="site-block-quote">
          <p>{textValue(content.text)}</p>
          {content.cite ? <cite>{textValue(content.cite)}</cite> : null}
        </blockquote>
      );
    case 'CALLOUT':
      return renderWithShell(
        block,
        <aside className="site-block-callout">
          {content.icon ? <em>{textValue(content.icon)}</em> : null}
          {content.title ? <strong>{textValue(content.title)}</strong> : null}
          {content.text ? <span>{textValue(content.text)}</span> : null}
        </aside>
      );
    case 'BUTTON':
      return renderWithShell(
        block,
        <div className="site-block-button-row">
          <a className="button button-primary" href={textValue(content.url || content.href, '#')} target={textValue(content.target, '_self')} rel="noreferrer">
            {textValue(content.label)}
          </a>
        </div>
      );
    case 'PROJECT_INFO': {
      const techStacks = stringList(content.techStacks);
      const items = [
        ['기간', textValue(content.period)],
        ['역할', textValue(content.role)],
        ['기여도', textValue(content.contribution)],
        ['카테고리', textValue(content.category)],
        ['기술', techStacks.join(', ')]
      ].filter(([, value]) => value);
      return renderWithShell(
        block,
        <dl className="site-project-info">
          {items.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      );
    }
    case 'TABS': {
      const tabs = listValue(content.tabs);
      return renderWithShell(
        block,
        <div className="site-tabs-block">
          {tabs.map((tab, index) => (
            <article key={`${textValue(tab.title)}-${index}`}>
              <h3>{textValue(tab.title)}</h3>
              <p>{textValue(tab.content)}</p>
            </article>
          ))}
        </div>
      );
    }
    case 'TWO_COLUMN':
      return renderWithShell(
        block,
        <div className="site-two-column">
          <article>
            <h3>{textValue(content.leftTitle)}</h3>
            <p>{textValue(content.leftText)}</p>
          </article>
          <article>
            <h3>{textValue(content.rightTitle)}</h3>
            <p>{textValue(content.rightText)}</p>
          </article>
        </div>
      );
    case 'PROJECT_CARD': {
      const imageUrl = textValue(content.imageUrl);
      return renderWithShell(
        block,
        <article className="site-project-card">
          <a href={textValue(content.href, '#')}>
            <div className="site-project-card-image">
              {imageUrl ? <img src={assetUrl(imageUrl)} alt={textValue(content.title)} /> : null}
            </div>
            <div className="site-project-card-body">
              <p>{textValue(content.category)}</p>
              <h3>{textValue(content.title)}</h3>
              <span>{textValue(content.description)}</span>
            </div>
          </a>
        </article>
      );
    }
    case 'TEXT':
    default:
      return renderWithShell(block, <p className="site-block-text">{textValue(content.text)}</p>);
  }
}
