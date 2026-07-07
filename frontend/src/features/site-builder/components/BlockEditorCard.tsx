import { useEffect, useState } from 'react';
import { blockLabel } from '../blockCatalog';
import type { SiteBlock } from '../types';

type BlockEditorCardProps = {
  block: SiteBlock;
  isSaving: boolean;
  onChange: (content: Record<string, unknown>, settings: Record<string, unknown>, visible: boolean) => void;
  onSave: (content: Record<string, unknown>, settings: Record<string, unknown>, visible: boolean) => void;
  onDelete: () => void;
};

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function numberValue(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function BlockEditorCard({ block, isSaving, onChange, onSave, onDelete }: BlockEditorCardProps) {
  const [content, setContent] = useState<Record<string, unknown>>(block.content ?? {});
  const [settings, setSettings] = useState<Record<string, unknown>>(block.settings ?? {});
  const [visible, setVisible] = useState(block.visible);

  useEffect(() => {
    setContent(block.content ?? {});
    setSettings(block.settings ?? {});
    setVisible(block.visible);
  }, [block.id, block.content, block.settings, block.visible]);

  function emitChange(nextContent = content, nextSettings = settings, nextVisible = visible) {
    console.log('[builder:block-change]', {
      blockId: block.id,
      blockType: block.blockType,
      content: nextContent,
      settings: nextSettings,
      visible: nextVisible
    });
    onChange(nextContent, nextSettings, nextVisible);
  }

  function patch(key: string, value: unknown) {
    setContent((current) => {
      const next = { ...current, [key]: value };
      emitChange(next, settings, visible);
      return next;
    });
  }

  function patchSettings(key: string, value: string | number) {
    setSettings((current) => {
      const next = { ...current, [key]: value };
      emitChange(content, next, visible);
      return next;
    });
  }

  function patchVisible(nextVisible: boolean) {
    setVisible(nextVisible);
    emitChange(content, settings, nextVisible);
  }

  function handleSave() {
    console.log('[builder:block-save-click]', {
      blockId: block.id,
      blockType: block.blockType,
      content,
      settings,
      visible
    });
    onSave(content, settings, visible);
  }

  return (
    <article className="block-editor-card">
      <div className="block-editor-card-header">
        <div>
          <p className="panel-label">{blockLabel(block.blockType)}</p>
          <h3>선택한 블록 설정</h3>
        </div>
        <button className="button button-ghost" type="button" onClick={onDelete}>
          삭제
        </button>
      </div>

      <div className="block-common-settings">
        <label>
          <input type="checkbox" checked={visible} onChange={(event) => patchVisible(event.target.checked)} />
          공개
        </label>
        <label className="field">
          <span>너비</span>
          <select value={stringValue(settings.width) || 'normal'} onChange={(event) => patchSettings('width', event.target.value)}>
            <option value="narrow">좁게</option>
            <option value="normal">기본</option>
            <option value="wide">넓게</option>
            <option value="full">전체 폭</option>
          </select>
        </label>
        <label className="field">
          <span>정렬</span>
          <select value={stringValue(settings.align) || 'left'} onChange={(event) => patchSettings('align', event.target.value)}>
            <option value="left">왼쪽</option>
            <option value="center">가운데</option>
            <option value="right">오른쪽</option>
          </select>
        </label>
        <label className="field">
          <span>배경색</span>
          <input placeholder="#ffffff" value={stringValue(settings.backgroundColor)} onChange={(event) => patchSettings('backgroundColor', event.target.value)} />
        </label>
        <label className="field">
          <span>글자 크기</span>
          <input type="number" min={12} max={96} value={numberValue(settings.fontSize, 0)} onChange={(event) => patchSettings('fontSize', Number(event.target.value))} />
        </label>
        <label className="field">
          <span>위 여백</span>
          <input type="number" min={0} max={160} value={numberValue(settings.paddingTop, 0)} onChange={(event) => patchSettings('paddingTop', Number(event.target.value))} />
        </label>
        <label className="field">
          <span>아래 여백</span>
          <input type="number" min={0} max={160} value={numberValue(settings.paddingBottom, 0)} onChange={(event) => patchSettings('paddingBottom', Number(event.target.value))} />
        </label>
      </div>

      <div className="block-fields">{renderFields(block, content, patch)}</div>

      <button className="button button-primary" type="button" disabled={isSaving} onClick={handleSave}>
        {isSaving ? '저장 중...' : '블록 저장'}
      </button>
    </article>
  );
}

function renderFields(block: SiteBlock, content: Record<string, unknown>, patch: (key: string, value: unknown) => void) {
  switch (block.blockType) {
    case 'HEADING':
      return (
        <>
          <label className="field">
            <span>제목</span>
            <input value={stringValue(content.text)} onChange={(event) => patch('text', event.target.value)} />
          </label>
          <label className="field">
            <span>제목 크기</span>
            <select value={String(content.level ?? 2)} onChange={(event) => patch('level', Number(event.target.value))}>
              <option value="1">큰 제목</option>
              <option value="2">섹션 제목</option>
            </select>
          </label>
        </>
      );
    case 'IMAGE':
      return (
        <>
          <label className="field">
            <span>이미지 URL</span>
            <input placeholder="https://..." value={stringValue(content.imageUrl)} onChange={(event) => patch('imageUrl', event.target.value)} />
          </label>
          <label className="field">
            <span>대체 텍스트</span>
            <input value={stringValue(content.alt)} onChange={(event) => patch('alt', event.target.value)} />
          </label>
          <label className="field">
            <span>캡션</span>
            <input value={stringValue(content.caption)} onChange={(event) => patch('caption', event.target.value)} />
          </label>
        </>
      );
    case 'PHOTO_GRID':
      return (
        <>
          <label className="field">
            <span>이미지 목록</span>
            <textarea value={photoGridToText(content.images)} onChange={(event) => patch('images', photoGridFromText(event.target.value))} />
          </label>
          <p className="field-hint">한 줄에 하나씩 입력하세요. 형식: 이미지 URL | 설명 | 캡션</p>
          <label className="field">
            <span>열 개수</span>
            <input type="number" min={1} max={4} value={Number(content.columns ?? 3)} onChange={(event) => patch('columns', Number(event.target.value))} />
          </label>
          <label className="field">
            <span>간격</span>
            <input type="number" min={0} max={80} value={Number(content.gap ?? 16)} onChange={(event) => patch('gap', Number(event.target.value))} />
          </label>
        </>
      );
    case 'DIVIDER':
      return <p className="muted">구분선은 공통 여백과 너비 설정만 사용합니다.</p>;
    case 'QUOTE':
      return (
        <>
          <label className="field">
            <span>인용문</span>
            <textarea value={stringValue(content.text)} onChange={(event) => patch('text', event.target.value)} />
          </label>
          <label className="field">
            <span>출처</span>
            <input value={stringValue(content.cite)} onChange={(event) => patch('cite', event.target.value)} />
          </label>
        </>
      );
    case 'CALLOUT':
      return (
        <>
          <label className="field">
            <span>아이콘/라벨</span>
            <input value={stringValue(content.icon)} onChange={(event) => patch('icon', event.target.value)} />
          </label>
          <label className="field">
            <span>제목</span>
            <input value={stringValue(content.title)} onChange={(event) => patch('title', event.target.value)} />
          </label>
          <label className="field">
            <span>강조 내용</span>
            <textarea value={stringValue(content.text)} onChange={(event) => patch('text', event.target.value)} />
          </label>
        </>
      );
    case 'BUTTON':
      return (
        <>
          <label className="field">
            <span>버튼 문구</span>
            <input value={stringValue(content.label)} onChange={(event) => patch('label', event.target.value)} />
          </label>
          <label className="field">
            <span>링크</span>
            <input placeholder="https://..." value={stringValue(content.url || content.href)} onChange={(event) => patch('url', event.target.value)} />
          </label>
          <label className="field">
            <span>열기 방식</span>
            <select value={stringValue(content.target) || '_blank'} onChange={(event) => patch('target', event.target.value)}>
              <option value="_blank">새 탭</option>
              <option value="_self">현재 탭</option>
            </select>
          </label>
        </>
      );
    case 'PROJECT_INFO':
      return (
        <>
          <label className="field">
            <span>기간</span>
            <input value={stringValue(content.period)} onChange={(event) => patch('period', event.target.value)} />
          </label>
          <label className="field">
            <span>역할</span>
            <input value={stringValue(content.role)} onChange={(event) => patch('role', event.target.value)} />
          </label>
          <label className="field">
            <span>기여도</span>
            <input value={stringValue(content.contribution)} onChange={(event) => patch('contribution', event.target.value)} />
          </label>
          <label className="field">
            <span>카테고리</span>
            <input value={stringValue(content.category)} onChange={(event) => patch('category', event.target.value)} />
          </label>
          <label className="field">
            <span>기술 스택</span>
            <input value={arrayToCsv(content.techStacks)} onChange={(event) => patch('techStacks', csvToArray(event.target.value))} />
          </label>
        </>
      );
    case 'TABS':
      return (
        <>
          <label className="field">
            <span>탭 내용</span>
            <textarea value={tabsToText(content.tabs)} onChange={(event) => patch('tabs', tabsFromText(event.target.value))} />
          </label>
          <p className="field-hint">한 줄에 하나씩 입력하세요. 형식: 탭 제목 | 내용</p>
        </>
      );
    case 'TWO_COLUMN':
      return (
        <>
          <label className="field">
            <span>왼쪽 제목</span>
            <input value={stringValue(content.leftTitle)} onChange={(event) => patch('leftTitle', event.target.value)} />
          </label>
          <label className="field">
            <span>왼쪽 본문</span>
            <textarea value={stringValue(content.leftText)} onChange={(event) => patch('leftText', event.target.value)} />
          </label>
          <label className="field">
            <span>오른쪽 제목</span>
            <input value={stringValue(content.rightTitle)} onChange={(event) => patch('rightTitle', event.target.value)} />
          </label>
          <label className="field">
            <span>오른쪽 본문</span>
            <textarea value={stringValue(content.rightText)} onChange={(event) => patch('rightText', event.target.value)} />
          </label>
        </>
      );
    case 'PROJECT_CARD':
      return (
        <>
          <label className="field">
            <span>프로젝트 제목</span>
            <input value={stringValue(content.title)} onChange={(event) => patch('title', event.target.value)} />
          </label>
          <label className="field">
            <span>설명</span>
            <textarea value={stringValue(content.description)} onChange={(event) => patch('description', event.target.value)} />
          </label>
          <label className="field">
            <span>이미지 URL</span>
            <input placeholder="https://..." value={stringValue(content.imageUrl)} onChange={(event) => patch('imageUrl', event.target.value)} />
          </label>
          <label className="field">
            <span>연결 링크</span>
            <input placeholder="https://..." value={stringValue(content.href)} onChange={(event) => patch('href', event.target.value)} />
          </label>
        </>
      );
    case 'TEXT':
    default:
      return (
        <label className="field">
          <span>본문</span>
          <textarea value={stringValue(content.text)} onChange={(event) => patch('text', event.target.value)} />
        </label>
      );
  }
}

function arrayToCsv(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').join(', ') : '';
}

function csvToArray(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function photoGridToText(value: unknown) {
  if (!Array.isArray(value)) {
    return '';
  }
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return '';
      }
      const image = item as Record<string, unknown>;
      return [stringValue(image.url), stringValue(image.alt), stringValue(image.caption)].join(' | ');
    })
    .join('\n');
}

function photoGridFromText(value: string) {
  return value
    .split('\n')
    .map((line) => {
      const [url = '', alt = '', caption = ''] = line.split('|').map((item) => item.trim());
      return { url, alt, caption };
    })
    .filter((image) => image.url || image.alt || image.caption);
}

function tabsToText(value: unknown) {
  if (!Array.isArray(value)) {
    return '';
  }
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return '';
      }
      const tab = item as Record<string, unknown>;
      return [stringValue(tab.title), stringValue(tab.content)].join(' | ');
    })
    .join('\n');
}

function tabsFromText(value: string) {
  return value
    .split('\n')
    .map((line) => {
      const [title = '', content = ''] = line.split('|').map((item) => item.trim());
      return { title, content };
    })
    .filter((tab) => tab.title || tab.content);
}
