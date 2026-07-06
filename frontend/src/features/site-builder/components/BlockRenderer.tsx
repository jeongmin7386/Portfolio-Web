import { assetUrl } from '../../../lib/apiClient';
import type { SiteBlock } from '../types';

type BlockRendererProps = {
  block: SiteBlock;
};

function textValue(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function listValue(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object') : [];
}

function stringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export function BlockRenderer({ block }: BlockRendererProps) {
  const content = block.content ?? {};

  switch (block.blockType) {
    case 'HEADING': {
      const text = textValue(content.text, '새 제목');
      const level = Number(content.level ?? 2);
      if (level <= 1) {
        return <h1 className="site-block-heading site-block-heading-hero">{text}</h1>;
      }
      return <h2 className="site-block-heading">{text}</h2>;
    }
    case 'IMAGE': {
      const imageUrl = textValue(content.imageUrl || content.url);
      return (
        <figure className="site-block-image">
          {imageUrl ? <img src={assetUrl(imageUrl)} alt={textValue(content.alt)} /> : <div className="image-placeholder">이미지 URL을 입력하세요</div>}
          {content.caption ? <figcaption>{textValue(content.caption)}</figcaption> : null}
        </figure>
      );
    }
    case 'PHOTO_GRID': {
      const images = listValue(content.images);
      const columns = Number(content.columns ?? 3);
      return (
        <div className="site-photo-grid" style={{ gridTemplateColumns: `repeat(${Math.max(1, Math.min(columns, 4))}, minmax(0, 1fr))`, gap: Number(content.gap ?? 16) }}>
          {images.map((image, index) => {
            const imageUrl = textValue(image.url);
            return (
              <figure key={`${imageUrl}-${index}`}>
                {imageUrl ? <img src={assetUrl(imageUrl)} alt={textValue(image.alt)} /> : <div className="image-placeholder">이미지</div>}
                {image.caption ? <figcaption>{textValue(image.caption)}</figcaption> : null}
              </figure>
            );
          })}
        </div>
      );
    }
    case 'DIVIDER':
      return <hr className="site-block-divider" />;
    case 'QUOTE':
      return (
        <blockquote className="site-block-quote">
          <p>{textValue(content.text, '인용문을 입력하세요.')}</p>
          {content.cite ? <cite>{textValue(content.cite)}</cite> : null}
        </blockquote>
      );
    case 'CALLOUT':
      return (
        <aside className="site-block-callout">
          <strong>{textValue(content.title, '핵심 포인트')}</strong>
          <span>{textValue(content.text, '강조하고 싶은 내용을 입력하세요.')}</span>
        </aside>
      );
    case 'BUTTON':
      return (
        <div className="site-block-button-row">
          <a className="button button-primary" href={textValue(content.url || content.href, '#')} target={textValue(content.target, '_self')}>
            {textValue(content.label, '버튼')}
          </a>
        </div>
      );
    case 'PROJECT_INFO': {
      const techStacks = stringList(content.techStacks);
      return (
        <dl className="site-project-info">
          <div>
            <dt>기간</dt>
            <dd>{textValue(content.period, '기간을 입력하세요')}</dd>
          </div>
          <div>
            <dt>역할</dt>
            <dd>{textValue(content.role, '역할을 입력하세요')}</dd>
          </div>
          <div>
            <dt>기여도</dt>
            <dd>{textValue(content.contribution, '기여도를 입력하세요')}</dd>
          </div>
          <div>
            <dt>기술</dt>
            <dd>{techStacks.join(', ') || '기술 스택'}</dd>
          </div>
        </dl>
      );
    }
    case 'TABS': {
      const tabs = listValue(content.tabs);
      return (
        <div className="site-tabs-block">
          {tabs.map((tab, index) => (
            <article key={`${textValue(tab.title)}-${index}`}>
              <h3>{textValue(tab.title, `탭 ${index + 1}`)}</h3>
              <p>{textValue(tab.content, '내용을 입력하세요.')}</p>
            </article>
          ))}
        </div>
      );
    }
    case 'TWO_COLUMN':
      return (
        <div className="site-two-column">
          <article>
            <h3>{textValue(content.leftTitle, '왼쪽 제목')}</h3>
            <p>{textValue(content.leftText, '왼쪽 내용을 입력하세요.')}</p>
          </article>
          <article>
            <h3>{textValue(content.rightTitle, '오른쪽 제목')}</h3>
            <p>{textValue(content.rightText, '오른쪽 내용을 입력하세요.')}</p>
          </article>
        </div>
      );
    case 'PROJECT_CARD': {
      const imageUrl = textValue(content.imageUrl);
      return (
        <article className="site-project-card">
          <a href={textValue(content.href, '#')}>
            <div className="site-project-card-image">
              {imageUrl ? <img src={assetUrl(imageUrl)} alt={textValue(content.title)} /> : <span>프로젝트 이미지</span>}
            </div>
            <div className="site-project-card-body">
              <p>프로젝트</p>
              <h3>{textValue(content.title, '새 프로젝트')}</h3>
              <span>{textValue(content.description, '프로젝트 설명을 입력하세요.')}</span>
            </div>
          </a>
        </article>
      );
    }
    case 'TEXT':
    default:
      return <p className="site-block-text">{textValue(content.text, '본문을 입력하세요.')}</p>;
  }
}
