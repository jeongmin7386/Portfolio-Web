import { useEffect, useState } from 'react';
import { blockLabel } from '../blockCatalog';
import type { SiteBlock } from '../types';

type BlockEditorCardProps = {
  block: SiteBlock;
  isSaving: boolean;
  onSave: (content: Record<string, unknown>) => void;
  onDelete: () => void;
};

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : '';
}

export function BlockEditorCard({ block, isSaving, onSave, onDelete }: BlockEditorCardProps) {
  const [content, setContent] = useState<Record<string, unknown>>(block.content ?? {});

  useEffect(() => {
    setContent(block.content ?? {});
  }, [block.id, block.content]);

  function patch(key: string, value: string | number) {
    setContent((current) => ({ ...current, [key]: value }));
  }

  return (
    <article className="block-editor-card">
      <div className="block-editor-card-header">
        <div>
          <p className="panel-label">{blockLabel(block.blockType)}</p>
          <h3>블록 설정</h3>
        </div>
        <button className="button button-ghost" type="button" onClick={onDelete}>
          삭제
        </button>
      </div>

      <div className="block-fields">{renderFields(block, content, patch)}</div>

      <button className="button button-primary" type="button" disabled={isSaving} onClick={() => onSave(content)}>
        {isSaving ? '저장 중...' : '블록 저장'}
      </button>
    </article>
  );
}

function renderFields(block: SiteBlock, content: Record<string, unknown>, patch: (key: string, value: string | number) => void) {
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
              <option value="1">히어로 제목</option>
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
    case 'DIVIDER':
      return <p className="muted">구분선은 별도 입력 없이 콘텐츠 사이를 나눕니다.</p>;
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
        <label className="field">
          <span>강조 내용</span>
          <textarea value={stringValue(content.text)} onChange={(event) => patch('text', event.target.value)} />
        </label>
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
            <input placeholder="https://..." value={stringValue(content.href)} onChange={(event) => patch('href', event.target.value)} />
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
