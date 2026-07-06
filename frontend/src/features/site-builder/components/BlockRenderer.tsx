import { assetUrl } from '../../../lib/apiClient';
import type { SiteBlock } from '../types';

type BlockRendererProps = {
  block: SiteBlock;
};

function textValue(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value : fallback;
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
      const imageUrl = textValue(content.imageUrl);
      return (
        <figure className="site-block-image">
          {imageUrl ? <img src={assetUrl(imageUrl)} alt={textValue(content.alt)} /> : <div className="image-placeholder">이미지 URL을 입력하세요</div>}
          {content.caption ? <figcaption>{textValue(content.caption)}</figcaption> : null}
        </figure>
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
      return <aside className="site-block-callout">{textValue(content.text, '강조하고 싶은 내용을 입력하세요.')}</aside>;
    case 'BUTTON':
      return (
        <div className="site-block-button-row">
          <a className="button button-primary" href={textValue(content.href, '#')}>
            {textValue(content.label, '버튼')}
          </a>
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
