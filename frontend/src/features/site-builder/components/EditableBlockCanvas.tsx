import type { CSSProperties, MouseEvent, ReactNode } from 'react';
import { assetUrl } from '../../../lib/apiClient';
import type { SiteBlock } from '../types';

type EditableBlockCanvasProps = {
  block: SiteBlock;
  selected: boolean;
  onSelect: () => void;
  onChange: (block: SiteBlock) => void;
};

function textValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
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
  return {
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
}

export function EditableBlockCanvas({ block, selected, onSelect, onChange }: EditableBlockCanvasProps) {
  const content = block.content ?? {};

  function patchContent(key: string, value: unknown) {
    const next = { ...block, content: { ...content, [key]: value } };
    console.log('[builder:canvas-block-change]', { blockId: block.id, key, value, next });
    onChange(next);
  }

  function patchBlock(nextContent: Record<string, unknown>) {
    const next = { ...block, content: nextContent };
    console.log('[builder:canvas-block-change]', { blockId: block.id, content: nextContent, next });
    onChange(next);
  }

  function stop(event: MouseEvent<HTMLElement>) {
    event.stopPropagation();
  }

  return (
    <div
      className={`canvas-editable-object ${selected ? 'selected' : ''}`}
      style={blockStyle(block)}
      onClick={onSelect}
      role="button"
      tabIndex={0}
    >
      <span className="canvas-object-label">{block.blockType}</span>
      {renderEditableBlock(block, content, selected, patchContent, patchBlock, stop)}
    </div>
  );
}

function renderEditableBlock(
  block: SiteBlock,
  content: Record<string, unknown>,
  selected: boolean,
  patch: (key: string, value: unknown) => void,
  patchBlock: (content: Record<string, unknown>) => void,
  stop: (event: MouseEvent<HTMLElement>) => void
) {
  if (!selected) {
    return renderReadonlyBlock(block, content);
  }

  switch (block.blockType) {
    case 'HEADING':
      return (
        <textarea
          className={`canvas-inline-input canvas-heading-input ${Number(content.level ?? 2) <= 1 ? 'hero' : ''}`}
          value={textValue(content.text)}
          onClick={stop}
          onChange={(event) => patch('text', event.target.value)}
        />
      );
    case 'TEXT':
      return (
        <textarea
          className="canvas-inline-input canvas-text-input"
          value={textValue(content.text)}
          onClick={stop}
          onChange={(event) => patch('text', event.target.value)}
        />
      );
    case 'IMAGE':
      return (
        <figure className="site-block-image canvas-editable-media">
          {textValue(content.imageUrl || content.url) ? (
            <img src={assetUrl(textValue(content.imageUrl || content.url))} alt={textValue(content.alt)} />
          ) : (
            <div className="image-placeholder">이미지 URL을 입력하세요</div>
          )}
          <div className="canvas-object-fields" onClick={stop}>
            <input value={textValue(content.imageUrl || content.url)} onChange={(event) => patch('imageUrl', event.target.value)} placeholder="이미지 URL" />
            <input value={textValue(content.alt)} onChange={(event) => patch('alt', event.target.value)} placeholder="대체 텍스트" />
            <input value={textValue(content.caption)} onChange={(event) => patch('caption', event.target.value)} placeholder="캡션" />
          </div>
        </figure>
      );
    case 'PHOTO_GRID': {
      const images = listValue(content.images);
      return (
        <div className="canvas-editable-grid" onClick={stop}>
          <div className="site-photo-grid" style={{ gridTemplateColumns: `repeat(${Math.max(1, Math.min(Number(content.columns ?? 3), 4))}, minmax(0, 1fr))`, gap: Number(content.gap ?? 16) }}>
            {images.map((image, index) => (
              <figure key={`${textValue(image.url)}-${index}`}>
                {textValue(image.url) ? <img src={assetUrl(textValue(image.url))} alt={textValue(image.alt)} /> : <div className="image-placeholder">이미지</div>}
                <input
                  value={textValue(image.url)}
                  onChange={(event) => patchBlock(updateArrayItem(content, 'images', index, { ...image, url: event.target.value }))}
                  placeholder="이미지 URL"
                />
                <input
                  value={textValue(image.alt)}
                  onChange={(event) => patchBlock(updateArrayItem(content, 'images', index, { ...image, alt: event.target.value }))}
                  placeholder="설명"
                />
                <input
                  value={textValue(image.caption)}
                  onChange={(event) => patchBlock(updateArrayItem(content, 'images', index, { ...image, caption: event.target.value }))}
                  placeholder="캡션"
                />
              </figure>
            ))}
          </div>
          <button
            className="button button-secondary canvas-small-button"
            type="button"
            onClick={() => patch('images', [...images, { url: '', alt: '', caption: '' }])}
          >
            이미지 추가
          </button>
        </div>
      );
    }
    case 'QUOTE':
      return (
        <blockquote className="site-block-quote canvas-editable-quote" onClick={stop}>
          <textarea value={textValue(content.text)} onChange={(event) => patch('text', event.target.value)} />
          <input value={textValue(content.cite)} onChange={(event) => patch('cite', event.target.value)} placeholder="출처" />
        </blockquote>
      );
    case 'CALLOUT':
      return (
        <aside className="site-block-callout canvas-object-fields" onClick={stop}>
          <input value={textValue(content.icon)} onChange={(event) => patch('icon', event.target.value)} placeholder="아이콘/라벨" />
          <input value={textValue(content.title)} onChange={(event) => patch('title', event.target.value)} placeholder="제목" />
          <textarea value={textValue(content.text)} onChange={(event) => patch('text', event.target.value)} placeholder="내용" />
        </aside>
      );
    case 'BUTTON':
      return (
        <div className="canvas-object-fields canvas-button-fields" onClick={stop}>
          <input value={textValue(content.label)} onChange={(event) => patch('label', event.target.value)} placeholder="버튼 문구" />
          <input value={textValue(content.url || content.href)} onChange={(event) => patch('url', event.target.value)} placeholder="링크 URL" />
          <a className="button button-primary" href={textValue(content.url || content.href, '#')} target={textValue(content.target, '_self')} rel="noreferrer">
            {textValue(content.label, '버튼')}
          </a>
        </div>
      );
    case 'PROJECT_INFO':
      return (
        <dl className="site-project-info canvas-project-info-edit" onClick={stop}>
          {[
            ['period', '기간'],
            ['role', '역할'],
            ['contribution', '기여도'],
            ['category', '카테고리']
          ].map(([key, label]) => (
            <div key={key}>
              <dt>{label}</dt>
              <dd>
                <input value={textValue(content[key])} onChange={(event) => patch(key, event.target.value)} />
              </dd>
            </div>
          ))}
          <div>
            <dt>기술</dt>
            <dd>
              <input value={stringList(content.techStacks).join(', ')} onChange={(event) => patch('techStacks', csvToArray(event.target.value))} />
            </dd>
          </div>
        </dl>
      );
    case 'TABS': {
      const tabs = listValue(content.tabs);
      return (
        <div className="site-tabs-block canvas-editable-grid" onClick={stop}>
          {tabs.map((tab, index) => (
            <article key={`${textValue(tab.title)}-${index}`} className="canvas-object-fields">
              <input
                value={textValue(tab.title)}
                onChange={(event) => patchBlock(updateArrayItem(content, 'tabs', index, { ...tab, title: event.target.value }))}
                placeholder="탭 제목"
              />
              <textarea
                value={textValue(tab.content)}
                onChange={(event) => patchBlock(updateArrayItem(content, 'tabs', index, { ...tab, content: event.target.value }))}
                placeholder="탭 내용"
              />
            </article>
          ))}
          <button className="button button-secondary canvas-small-button" type="button" onClick={() => patch('tabs', [...tabs, { title: '', content: '' }])}>
            탭 추가
          </button>
        </div>
      );
    }
    case 'TWO_COLUMN':
      return (
        <div className="site-two-column canvas-editable-grid" onClick={stop}>
          <article className="canvas-object-fields">
            <input value={textValue(content.leftTitle)} onChange={(event) => patch('leftTitle', event.target.value)} placeholder="왼쪽 제목" />
            <textarea value={textValue(content.leftText)} onChange={(event) => patch('leftText', event.target.value)} placeholder="왼쪽 본문" />
          </article>
          <article className="canvas-object-fields">
            <input value={textValue(content.rightTitle)} onChange={(event) => patch('rightTitle', event.target.value)} placeholder="오른쪽 제목" />
            <textarea value={textValue(content.rightText)} onChange={(event) => patch('rightText', event.target.value)} placeholder="오른쪽 본문" />
          </article>
        </div>
      );
    case 'PROJECT_CARD':
      return (
        <article className="site-project-card canvas-project-card-edit" onClick={stop}>
          <div className="site-project-card-image">
            {textValue(content.imageUrl) ? <img src={assetUrl(textValue(content.imageUrl))} alt={textValue(content.title)} /> : <span>프로젝트 이미지</span>}
          </div>
          <div className="site-project-card-body canvas-object-fields">
            <input value={textValue(content.category)} onChange={(event) => patch('category', event.target.value)} placeholder="카테고리" />
            <input value={textValue(content.title)} onChange={(event) => patch('title', event.target.value)} placeholder="프로젝트 제목" />
            <textarea value={textValue(content.description)} onChange={(event) => patch('description', event.target.value)} placeholder="설명" />
            <input value={textValue(content.imageUrl)} onChange={(event) => patch('imageUrl', event.target.value)} placeholder="이미지 URL" />
            <input value={textValue(content.href)} onChange={(event) => patch('href', event.target.value)} placeholder="연결 링크" />
          </div>
        </article>
      );
    case 'DIVIDER':
      return <hr className="site-block-divider" />;
    default:
      return renderReadonlyBlock(block, content);
  }
}

function renderReadonlyBlock(block: SiteBlock, content: Record<string, unknown>) {
  switch (block.blockType) {
    case 'HEADING': {
      const level = Number(content.level ?? 2);
      return level <= 1 ? (
        <h1 className="site-block-heading site-block-heading-hero">{textValue(content.text)}</h1>
      ) : (
        <h2 className="site-block-heading">{textValue(content.text)}</h2>
      );
    }
    case 'IMAGE':
      return (
        <figure className="site-block-image">
          {textValue(content.imageUrl || content.url) ? <img src={assetUrl(textValue(content.imageUrl || content.url))} alt={textValue(content.alt)} /> : <div className="image-placeholder" />}
          {content.caption ? <figcaption>{textValue(content.caption)}</figcaption> : null}
        </figure>
      );
    case 'PHOTO_GRID':
      return (
        <div className="site-photo-grid" style={{ gridTemplateColumns: `repeat(${Math.max(1, Math.min(Number(content.columns ?? 3), 4))}, minmax(0, 1fr))`, gap: Number(content.gap ?? 16) }}>
          {listValue(content.images).map((image, index) => (
            <figure key={`${textValue(image.url)}-${index}`}>
              {textValue(image.url) ? <img src={assetUrl(textValue(image.url))} alt={textValue(image.alt)} /> : <div className="image-placeholder" />}
              {image.caption ? <figcaption>{textValue(image.caption)}</figcaption> : null}
            </figure>
          ))}
        </div>
      );
    case 'DIVIDER':
      return <hr className="site-block-divider" />;
    case 'QUOTE':
      return (
        <blockquote className="site-block-quote">
          <p>{textValue(content.text)}</p>
          {content.cite ? <cite>{textValue(content.cite)}</cite> : null}
        </blockquote>
      );
    case 'CALLOUT':
      return (
        <aside className="site-block-callout">
          {content.icon ? <em>{textValue(content.icon)}</em> : null}
          {content.title ? <strong>{textValue(content.title)}</strong> : null}
          {content.text ? <span>{textValue(content.text)}</span> : null}
        </aside>
      );
    case 'BUTTON':
      return (
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
      return (
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
    case 'TABS':
      return (
        <div className="site-tabs-block">
          {listValue(content.tabs).map((tab, index) => (
            <article key={`${textValue(tab.title)}-${index}`}>
              <h3>{textValue(tab.title)}</h3>
              <p>{textValue(tab.content)}</p>
            </article>
          ))}
        </div>
      );
    case 'TWO_COLUMN':
      return (
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
    case 'PROJECT_CARD':
      return (
        <article className="site-project-card">
          <div className="site-project-card-image">
            {textValue(content.imageUrl) ? <img src={assetUrl(textValue(content.imageUrl))} alt={textValue(content.title)} /> : null}
          </div>
          <div className="site-project-card-body">
            <p>{textValue(content.category)}</p>
            <h3>{textValue(content.title)}</h3>
            <span>{textValue(content.description)}</span>
          </div>
        </article>
      );
    case 'TEXT':
    default:
      return <p className="site-block-text">{textValue(content.text)}</p>;
  }
}

function updateArrayItem(content: Record<string, unknown>, key: string, index: number, value: Record<string, unknown>) {
  const items = listValue(content[key]);
  return {
    ...content,
    [key]: items.map((item, itemIndex) => (itemIndex === index ? value : item))
  };
}

function csvToArray(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
