import type { CSSProperties, MouseEvent } from 'react';
import { assetUrl } from '../../../lib/apiClient';
import type { SiteBlock } from '../types';

type EditableBlockCanvasProps = {
  block: SiteBlock;
  selected: boolean;
  onSelect: () => void;
  onChange: (block: SiteBlock) => void;
  showChrome?: boolean;
};

function textValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function numberValue(value: unknown, fallback?: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function listValue(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object') : [];
}

function stringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function blockStyle(block: SiteBlock, fillFrame: boolean): CSSProperties {
  const styles = block.styles ?? {};
  const backgroundColor = textValue(styles.backgroundColor) === 'transparent' ? undefined : textValue(styles.backgroundColor) || undefined;
  return {
    width: '100%',
    height: fillFrame ? '100%' : undefined,
    overflow: fillFrame ? 'auto' : undefined,
    color: textValue(styles.color) || undefined,
    backgroundColor,
    borderRadius: numberValue(styles.borderRadius),
    padding: numberValue(styles.padding),
    margin: numberValue(styles.margin),
    opacity: numberValue(styles.opacity),
    textAlign: textValue(styles.textAlign, 'left') as CSSProperties['textAlign'],
    fontSize: numberValue(styles.fontSize),
    fontWeight: numberValue(styles.fontWeight) as CSSProperties['fontWeight'],
    borderWidth: numberValue(styles.borderWidth),
    borderColor: textValue(styles.borderColor) || undefined,
    borderStyle: numberValue(styles.borderWidth, 0) ? textValue(styles.borderStyle, 'solid') : undefined
  };
}

export function EditableBlockCanvas({ block, selected, onSelect, onChange, showChrome = true }: EditableBlockCanvasProps) {
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
      className={showChrome ? `canvas-editable-object ${selected ? 'selected' : ''}` : 'site-rendered-object'}
      style={blockStyle(block, showChrome)}
      onClick={showChrome ? onSelect : undefined}
      role={showChrome ? 'button' : undefined}
      tabIndex={showChrome ? 0 : undefined}
    >
      {showChrome ? <span className="canvas-object-label">{block.blockType}</span> : null}
      {selected ? renderEditableBlock(block, content, patchContent, patchBlock, stop) : renderReadonlyBlock(block, content)}
    </div>
  );
}

function renderEditableBlock(
  block: SiteBlock,
  content: Record<string, unknown>,
  patch: (key: string, value: unknown) => void,
  patchBlock: (content: Record<string, unknown>) => void,
  stop: (event: MouseEvent<HTMLElement>) => void
) {
  switch (block.blockType) {
    case 'HEADING':
    case 'SUBHEADING':
      return (
        <textarea
          className={`canvas-inline-input canvas-heading-input ${Number(content.level ?? 2) <= 1 ? 'hero' : ''}`}
          value={textValue(content.text)}
          onClick={stop}
          onChange={(event) => patch('text', event.target.value)}
        />
      );
    case 'TEXT':
      return <textarea className="canvas-inline-input canvas-text-input" value={textValue(content.text)} onClick={stop} onChange={(event) => patch('text', event.target.value)} />;
    case 'IMAGE':
      return renderImageEditor(content, patch, stop);
    case 'PHOTO_GRID':
    case 'GALLERY':
    case 'SLIDER':
      return renderImageCollectionEditor(content, patch, patchBlock, stop);
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
          <input value={textValue(content.icon)} onChange={(event) => patch('icon', event.target.value)} placeholder="아이콘 또는 라벨" />
          <input value={textValue(content.title)} onChange={(event) => patch('title', event.target.value)} placeholder="제목" />
          <textarea value={textValue(content.text)} onChange={(event) => patch('text', event.target.value)} placeholder="내용" />
        </aside>
      );
    case 'BUTTON':
    case 'GITHUB_LINK':
    case 'LIVE_LINK':
      return renderButtonEditor(content, patch, stop);
    case 'PROJECT_INFO':
      return renderProjectInfoEditor(content, patch, stop);
    case 'TABS':
      return renderItemsEditor(content, 'tabs', '탭', patch, patchBlock, stop);
    case 'ACCORDION':
    case 'FAQ':
      return renderItemsEditor(content, 'items', '항목', patch, patchBlock, stop);
    case 'TWO_COLUMN':
    case 'COLUMNS':
      return renderTwoColumnEditor(content, patch, stop);
    case 'PROJECT_CARD':
      return renderProjectCardEditor(content, patch, stop);
    case 'LIST':
      return renderListEditor(content, patch, stop);
    case 'CHECKLIST':
      return renderChecklistEditor(content, patch, patchBlock, stop);
    case 'CODE':
      return (
        <div className="canvas-object-fields" onClick={stop}>
          <input value={textValue(content.language)} onChange={(event) => patch('language', event.target.value)} placeholder="언어" />
          <textarea className="canvas-code-input" value={textValue(content.code)} onChange={(event) => patch('code', event.target.value)} placeholder="코드" />
        </div>
      );
    case 'TABLE':
      return (
        <textarea
          className="canvas-inline-input canvas-text-input"
          value={rowsToText(content.rows)}
          onClick={stop}
          onChange={(event) => patch('rows', textToRows(event.target.value))}
        />
      );
    case 'SPACER':
      return (
        <label className="field" onClick={stop}>
          <span>여백 높이</span>
          <input type="number" value={numberValue(content.height, 120)} onChange={(event) => patch('height', Number(event.target.value))} />
        </label>
      );
    case 'WIDE_EMBED':
    case 'VIDEO_EMBED':
    case 'YOUTUBE_EMBED':
    case 'FIGMA_EMBED':
      return renderEmbedEditor(content, patch, stop);
    case 'LINK_CARD':
    case 'GITHUB_CARD':
    case 'RENDER_LINK_CARD':
    case 'NOTION_LINK_CARD':
      return renderLinkCardEditor(content, patch, stop);
    case 'BEFORE_AFTER':
      return renderBeforeAfterEditor(content, patch, stop);
    case 'TIMELINE':
      return renderItemsEditor(content, 'items', '타임라인', patch, patchBlock, stop);
    case 'CTA':
      return (
        <section className="canvas-object-fields site-cta-block" onClick={stop}>
          <input value={textValue(content.title)} onChange={(event) => patch('title', event.target.value)} placeholder="CTA 제목" />
          <textarea value={textValue(content.text)} onChange={(event) => patch('text', event.target.value)} placeholder="CTA 설명" />
          <input value={textValue(content.buttonText)} onChange={(event) => patch('buttonText', event.target.value)} placeholder="버튼 텍스트" />
          <input value={textValue(content.url)} onChange={(event) => patch('url', event.target.value)} placeholder="링크 URL" />
        </section>
      );
    case 'CONTACT_FORM':
      return (
        <section className="canvas-object-fields site-contact-block" onClick={stop}>
          <input value={textValue(content.title)} onChange={(event) => patch('title', event.target.value)} placeholder="문의 제목" />
          <input value={textValue(content.emailPlaceholder)} onChange={(event) => patch('emailPlaceholder', event.target.value)} placeholder="이메일 placeholder" />
          <textarea value={textValue(content.messagePlaceholder)} onChange={(event) => patch('messagePlaceholder', event.target.value)} placeholder="메시지 placeholder" />
        </section>
      );
    case 'SOCIAL_ICONS':
      return renderItemsEditor(content, 'links', '소셜 링크', patch, patchBlock, stop);
    case 'STAT_CARD':
      return (
        <section className="canvas-object-fields site-stat-card" onClick={stop}>
          <input value={textValue(content.value)} onChange={(event) => patch('value', event.target.value)} placeholder="지표" />
          <input value={textValue(content.label)} onChange={(event) => patch('label', event.target.value)} placeholder="라벨" />
          <textarea value={textValue(content.description)} onChange={(event) => patch('description', event.target.value)} placeholder="설명" />
        </section>
      );
    case 'SKILL_BAR':
      return (
        <section className="canvas-object-fields site-skill-bar" onClick={stop}>
          <input value={textValue(content.label)} onChange={(event) => patch('label', event.target.value)} placeholder="스킬" />
          <input type="number" min="0" max="100" value={numberValue(content.value, 0)} onChange={(event) => patch('value', Number(event.target.value))} />
        </section>
      );
    case 'TECH_STACK':
      return (
        <label className="field" onClick={stop}>
          <span>기술 스택</span>
          <input value={stringList(content.items).join(', ')} onChange={(event) => patch('items', csvToArray(event.target.value))} />
        </label>
      );
    case 'DIVIDER':
      return <hr className="site-block-divider" />;
    default:
      return renderGenericEditor(content, patch, stop);
  }
}

function renderReadonlyBlock(block: SiteBlock, content: Record<string, unknown>) {
  switch (block.blockType) {
    case 'HEADING':
    case 'SUBHEADING': {
      const level = Number(content.level ?? (block.blockType === 'HEADING' ? 2 : 3));
      return level <= 1 ? (
        <h1 className="site-block-heading site-block-heading-hero">{textValue(content.text)}</h1>
      ) : (
        <h2 className="site-block-heading">{textValue(content.text)}</h2>
      );
    }
    case 'IMAGE':
      return renderReadonlyImage(content);
    case 'PHOTO_GRID':
    case 'GALLERY':
    case 'SLIDER':
      return renderReadonlyImageCollection(content);
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
    case 'GITHUB_LINK':
    case 'LIVE_LINK':
      return renderReadonlyButton(content);
    case 'PROJECT_INFO':
      return renderReadonlyProjectInfo(content);
    case 'TABS':
      return renderReadonlyCards(listValue(content.tabs));
    case 'ACCORDION':
    case 'FAQ':
    case 'TIMELINE':
      return renderReadonlyCards(listValue(content.items));
    case 'TWO_COLUMN':
    case 'COLUMNS':
      return renderReadonlyTwoColumn(content);
    case 'PROJECT_CARD':
      return renderReadonlyProjectCard(content);
    case 'LIST':
      return <ul className="site-list-block">{stringList(content.items).map((item) => <li key={item}>{item}</li>)}</ul>;
    case 'CHECKLIST':
      return (
        <ul className="site-list-block checklist">
          {listValue(content.items).map((item, index) => (
            <li key={`${textValue(item.text)}-${index}`}>{item.checked ? '✓ ' : ''}{textValue(item.text)}</li>
          ))}
        </ul>
      );
    case 'CODE':
      return <pre className="site-code-block"><code>{textValue(content.code)}</code></pre>;
    case 'TABLE':
      return renderReadonlyTable(content.rows);
    case 'SPACER':
      return <div style={{ height: numberValue(content.height, 120) }} />;
    case 'WIDE_EMBED':
    case 'VIDEO_EMBED':
    case 'YOUTUBE_EMBED':
    case 'FIGMA_EMBED':
      return renderReadonlyEmbed(content);
    case 'LINK_CARD':
    case 'GITHUB_CARD':
    case 'RENDER_LINK_CARD':
    case 'NOTION_LINK_CARD':
      return renderReadonlyLinkCard(content);
    case 'BEFORE_AFTER':
      return renderReadonlyBeforeAfter(content);
    case 'CTA':
      return (
        <section className="site-cta-block">
          <h3>{textValue(content.title)}</h3>
          <p>{textValue(content.text)}</p>
          {content.buttonText ? <a className="button button-primary" href={textValue(content.url, '#')}>{textValue(content.buttonText)}</a> : null}
        </section>
      );
    case 'CONTACT_FORM':
      return (
        <section className="site-contact-block">
          <h3>{textValue(content.title, 'Contact')}</h3>
          <input readOnly placeholder={textValue(content.emailPlaceholder, 'email@example.com')} />
          <textarea readOnly placeholder={textValue(content.messagePlaceholder, '메시지')} />
        </section>
      );
    case 'SOCIAL_ICONS':
      return renderReadonlySocialLinks(listValue(content.links));
    case 'STAT_CARD':
      return (
        <section className="site-stat-card">
          <strong>{textValue(content.value)}</strong>
          <span>{textValue(content.label)}</span>
          <p>{textValue(content.description)}</p>
        </section>
      );
    case 'SKILL_BAR':
      return (
        <section className="site-skill-bar">
          <span>{textValue(content.label)}</span>
          <div><i style={{ width: `${numberValue(content.value, 0)}%` }} /></div>
        </section>
      );
    case 'TECH_STACK':
      return <div className="builder-tech-stack">{stringList(content.items).map((item) => <span key={item}>{item}</span>)}</div>;
    case 'TEXT':
    default:
      return <p className="site-block-text">{textValue(content.text) || firstText(content)}</p>;
  }
}

function renderImageEditor(content: Record<string, unknown>, patch: (key: string, value: unknown) => void, stop: (event: MouseEvent<HTMLElement>) => void) {
  const imageUrl = textValue(content.imageUrl || content.url);
  return (
    <figure className="site-block-image canvas-editable-media">
      {imageUrl ? <img src={assetUrl(imageUrl)} alt={textValue(content.alt)} /> : <div className="image-placeholder">이미지 URL을 입력하세요</div>}
      <div className="canvas-object-fields" onClick={stop}>
        <input value={imageUrl} onChange={(event) => patch('imageUrl', event.target.value)} placeholder="이미지 URL" />
        <input value={textValue(content.alt)} onChange={(event) => patch('alt', event.target.value)} placeholder="대체 텍스트" />
        <input value={textValue(content.caption)} onChange={(event) => patch('caption', event.target.value)} placeholder="캡션" />
      </div>
    </figure>
  );
}

function renderImageCollectionEditor(
  content: Record<string, unknown>,
  patch: (key: string, value: unknown) => void,
  patchBlock: (content: Record<string, unknown>) => void,
  stop: (event: MouseEvent<HTMLElement>) => void
) {
  const images = listValue(content.images);
  return (
    <div className="canvas-editable-grid" onClick={stop}>
      <div className="site-photo-grid" style={{ gridTemplateColumns: `repeat(${Math.max(1, Math.min(Number(content.columns ?? 3), 4))}, minmax(0, 1fr))`, gap: Number(content.gap ?? 16) }}>
        {images.map((image, index) => (
          <figure key={`${textValue(image.url)}-${index}`}>
            {textValue(image.url) ? <img src={assetUrl(textValue(image.url))} alt={textValue(image.alt)} /> : <div className="image-placeholder">이미지</div>}
            <input value={textValue(image.url)} onChange={(event) => patchBlock(updateArrayItem(content, 'images', index, { ...image, url: event.target.value }))} placeholder="이미지 URL" />
            <input value={textValue(image.caption)} onChange={(event) => patchBlock(updateArrayItem(content, 'images', index, { ...image, caption: event.target.value }))} placeholder="캡션" />
          </figure>
        ))}
      </div>
      <div className="compact-field-grid">
        <input type="number" value={Number(content.columns ?? 3)} onChange={(event) => patch('columns', Number(event.target.value))} />
        <input type="number" value={Number(content.gap ?? 16)} onChange={(event) => patch('gap', Number(event.target.value))} />
      </div>
      <button className="button button-secondary canvas-small-button" type="button" onClick={() => patch('images', [...images, { url: '', alt: '', caption: '' }])}>
        이미지 추가
      </button>
    </div>
  );
}

function renderButtonEditor(content: Record<string, unknown>, patch: (key: string, value: unknown) => void, stop: (event: MouseEvent<HTMLElement>) => void) {
  return (
    <div className="canvas-object-fields canvas-button-fields" onClick={stop}>
      <input value={textValue(content.label)} onChange={(event) => patch('label', event.target.value)} placeholder="버튼 문구" />
      <input value={textValue(content.url || content.href)} onChange={(event) => patch('url', event.target.value)} placeholder="링크 URL" />
      <a className="button button-primary" href={textValue(content.url || content.href, '#')} target={textValue(content.target, '_self')} rel="noreferrer">
        {textValue(content.label, '버튼')}
      </a>
    </div>
  );
}

function renderProjectInfoEditor(content: Record<string, unknown>, patch: (key: string, value: unknown) => void, stop: (event: MouseEvent<HTMLElement>) => void) {
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
          <dd><input value={textValue(content[key])} onChange={(event) => patch(key, event.target.value)} /></dd>
        </div>
      ))}
      <div>
        <dt>기술</dt>
        <dd><input value={stringList(content.techStacks).join(', ')} onChange={(event) => patch('techStacks', csvToArray(event.target.value))} /></dd>
      </div>
    </dl>
  );
}

function renderItemsEditor(
  content: Record<string, unknown>,
  key: string,
  label: string,
  patch: (key: string, value: unknown) => void,
  patchBlock: (content: Record<string, unknown>) => void,
  stop: (event: MouseEvent<HTMLElement>) => void
) {
  const items = listValue(content[key]);
  return (
    <div className="site-tabs-block canvas-editable-grid" onClick={stop}>
      {items.map((item, index) => (
        <article key={`${textValue(item.title || item.label)}-${index}`} className="canvas-object-fields">
          <input value={textValue(item.title || item.label)} onChange={(event) => patchBlock(updateArrayItem(content, key, index, { ...item, title: event.target.value, label: event.target.value }))} placeholder={`${label} 제목`} />
          <textarea value={textValue(item.content || item.text || item.url)} onChange={(event) => patchBlock(updateArrayItem(content, key, index, { ...item, content: event.target.value, text: event.target.value }))} placeholder={`${label} 내용`} />
        </article>
      ))}
      <button className="button button-secondary canvas-small-button" type="button" onClick={() => patch(key, [...items, { title: '', content: '' }])}>
        {label} 추가
      </button>
    </div>
  );
}

function renderTwoColumnEditor(content: Record<string, unknown>, patch: (key: string, value: unknown) => void, stop: (event: MouseEvent<HTMLElement>) => void) {
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
}

function renderProjectCardEditor(content: Record<string, unknown>, patch: (key: string, value: unknown) => void, stop: (event: MouseEvent<HTMLElement>) => void) {
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
}

function renderListEditor(content: Record<string, unknown>, patch: (key: string, value: unknown) => void, stop: (event: MouseEvent<HTMLElement>) => void) {
  return (
    <textarea
      className="canvas-inline-input canvas-text-input"
      value={stringList(content.items).join('\n')}
      onClick={stop}
      onChange={(event) => patch('items', event.target.value.split('\n').map((item) => item.trim()).filter(Boolean))}
    />
  );
}

function renderChecklistEditor(
  content: Record<string, unknown>,
  patch: (key: string, value: unknown) => void,
  patchBlock: (content: Record<string, unknown>) => void,
  stop: (event: MouseEvent<HTMLElement>) => void
) {
  const items = listValue(content.items);
  return (
    <div className="canvas-object-fields" onClick={stop}>
      {items.map((item, index) => (
        <label key={`${textValue(item.text)}-${index}`} className="builder-toggle-row">
          <input type="checkbox" checked={Boolean(item.checked)} onChange={(event) => patchBlock(updateArrayItem(content, 'items', index, { ...item, checked: event.target.checked }))} />
          <input value={textValue(item.text)} onChange={(event) => patchBlock(updateArrayItem(content, 'items', index, { ...item, text: event.target.value }))} />
        </label>
      ))}
      <button className="button button-secondary canvas-small-button" type="button" onClick={() => patch('items', [...items, { text: '', checked: false }])}>체크 항목 추가</button>
    </div>
  );
}

function renderEmbedEditor(content: Record<string, unknown>, patch: (key: string, value: unknown) => void, stop: (event: MouseEvent<HTMLElement>) => void) {
  return (
    <section className="site-embed-block canvas-object-fields" onClick={stop}>
      <input value={textValue(content.title)} onChange={(event) => patch('title', event.target.value)} placeholder="임베드 제목" />
      <input value={textValue(content.embedUrl || content.url)} onChange={(event) => patch('embedUrl', event.target.value)} placeholder="임베드 URL" />
      {textValue(content.embedUrl || content.url) ? <iframe title={textValue(content.title, 'Embed')} src={textValue(content.embedUrl || content.url)} /> : <div className="image-placeholder">임베드 URL을 입력하세요</div>}
    </section>
  );
}

function renderLinkCardEditor(content: Record<string, unknown>, patch: (key: string, value: unknown) => void, stop: (event: MouseEvent<HTMLElement>) => void) {
  return (
    <article className="site-link-card canvas-object-fields" onClick={stop}>
      <input value={textValue(content.title)} onChange={(event) => patch('title', event.target.value)} placeholder="카드 제목" />
      <textarea value={textValue(content.description)} onChange={(event) => patch('description', event.target.value)} placeholder="설명" />
      <input value={textValue(content.url)} onChange={(event) => patch('url', event.target.value)} placeholder="URL" />
    </article>
  );
}

function renderBeforeAfterEditor(content: Record<string, unknown>, patch: (key: string, value: unknown) => void, stop: (event: MouseEvent<HTMLElement>) => void) {
  return (
    <div className="site-before-after canvas-object-fields" onClick={stop}>
      <input value={textValue(content.beforeLabel)} onChange={(event) => patch('beforeLabel', event.target.value)} placeholder="Before 라벨" />
      <input value={textValue(content.beforeUrl)} onChange={(event) => patch('beforeUrl', event.target.value)} placeholder="Before 이미지 URL" />
      <input value={textValue(content.afterLabel)} onChange={(event) => patch('afterLabel', event.target.value)} placeholder="After 라벨" />
      <input value={textValue(content.afterUrl)} onChange={(event) => patch('afterUrl', event.target.value)} placeholder="After 이미지 URL" />
    </div>
  );
}

function renderGenericEditor(content: Record<string, unknown>, patch: (key: string, value: unknown) => void, stop: (event: MouseEvent<HTMLElement>) => void) {
  return (
    <div className="canvas-object-fields" onClick={stop}>
      {Object.entries(content).map(([key, value]) => (
        <label key={key} className="field">
          <span>{key}</span>
          {typeof value === 'number' ? (
            <input type="number" value={value} onChange={(event) => patch(key, Number(event.target.value))} />
          ) : typeof value === 'string' ? (
            <textarea value={value} onChange={(event) => patch(key, event.target.value)} />
          ) : (
            <textarea value={JSON.stringify(value, null, 2)} onChange={(event) => {
              try {
                patch(key, JSON.parse(event.target.value));
              } catch {
                console.log('[builder:canvas-json-waiting]', { key });
              }
            }} />
          )}
        </label>
      ))}
    </div>
  );
}

function renderReadonlyImage(content: Record<string, unknown>) {
  const imageUrl = textValue(content.imageUrl || content.url);
  return (
    <figure className="site-block-image">
      {imageUrl ? <img src={assetUrl(imageUrl)} alt={textValue(content.alt)} /> : <div className="image-placeholder" />}
      {content.caption ? <figcaption>{textValue(content.caption)}</figcaption> : null}
    </figure>
  );
}

function renderReadonlyImageCollection(content: Record<string, unknown>) {
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
}

function renderReadonlyButton(content: Record<string, unknown>) {
  return (
    <div className="site-block-button-row">
      <a className="button button-primary" href={textValue(content.url || content.href, '#')} target={textValue(content.target, '_self')} rel="noreferrer">
        {textValue(content.label, textValue(content.buttonText, '열기'))}
      </a>
    </div>
  );
}

function renderReadonlyProjectInfo(content: Record<string, unknown>) {
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

function renderReadonlyCards(items: Array<Record<string, unknown>>) {
  return (
    <div className="site-tabs-block">
      {items.map((item, index) => (
        <article key={`${textValue(item.title || item.label)}-${index}`}>
          <h3>{textValue(item.title || item.label)}</h3>
          <p>{textValue(item.content || item.text)}</p>
        </article>
      ))}
    </div>
  );
}

function renderReadonlyTwoColumn(content: Record<string, unknown>) {
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
}

function renderReadonlyProjectCard(content: Record<string, unknown>) {
  const imageUrl = textValue(content.imageUrl);
  return (
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

function renderReadonlyTable(rows: unknown) {
  const tableRows = Array.isArray(rows) ? rows.filter(Array.isArray) as unknown[][] : [];
  return (
    <table className="site-table-block">
      <tbody>
        {tableRows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) => <td key={cellIndex}>{String(cell ?? '')}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function renderReadonlyEmbed(content: Record<string, unknown>) {
  const embedUrl = textValue(content.embedUrl || content.url);
  return (
    <section className="site-embed-block">
      {content.title ? <h3>{textValue(content.title)}</h3> : null}
      {embedUrl ? <iframe title={textValue(content.title, 'Embed')} src={embedUrl} /> : <div className="image-placeholder" />}
    </section>
  );
}

function renderReadonlyLinkCard(content: Record<string, unknown>) {
  return (
    <a className="site-link-card" href={textValue(content.url, '#')} target="_blank" rel="noreferrer">
      <strong>{textValue(content.title)}</strong>
      <span>{textValue(content.description)}</span>
      <small>{textValue(content.url)}</small>
    </a>
  );
}

function renderReadonlyBeforeAfter(content: Record<string, unknown>) {
  return (
    <div className="site-before-after">
      {[['beforeUrl', 'beforeLabel'], ['afterUrl', 'afterLabel']].map(([urlKey, labelKey]) => (
        <figure key={urlKey}>
          {textValue(content[urlKey]) ? <img src={assetUrl(textValue(content[urlKey]))} alt={textValue(content[labelKey])} /> : <div className="image-placeholder" />}
          <figcaption>{textValue(content[labelKey])}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function renderReadonlySocialLinks(items: Array<Record<string, unknown>>) {
  return (
    <div className="site-social-links">
      {items.map((item, index) => (
        <a key={`${textValue(item.label)}-${index}`} href={textValue(item.url, '#')} target="_blank" rel="noreferrer">
          {textValue(item.label)}
        </a>
      ))}
    </div>
  );
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

function rowsToText(rows: unknown) {
  if (!Array.isArray(rows)) {
    return '';
  }
  return rows.map((row) => (Array.isArray(row) ? row.join(' | ') : String(row))).join('\n');
}

function textToRows(value: string) {
  return value.split('\n').map((row) => row.split('|').map((cell) => cell.trim()));
}

function firstText(content: Record<string, unknown>) {
  const value = Object.values(content).find((item) => typeof item === 'string' && item.trim());
  return textValue(value);
}
