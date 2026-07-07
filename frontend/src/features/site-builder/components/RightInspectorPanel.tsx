import { useEffect, useState } from 'react';
import { blockLabel, defaultBlockLayout, defaultBlockStyles } from '../blockCatalog';
import { embedProviderOptions } from '../embedProviders';
import type { BlockLayoutFrame, BlockStyles, DeviceMode, SiteBlock } from '../types';

type RightInspectorPanelProps = {
  block: SiteBlock | null;
  device: DeviceMode;
  isSaving: boolean;
  onChange: (block: SiteBlock) => void;
  onSave: () => void;
  onDelete: (block: SiteBlock) => void;
  onDuplicate: (block: SiteBlock) => void;
  onBringForward: (block: SiteBlock) => void;
  onSendBackward: (block: SiteBlock) => void;
  onToggleLock: (block: SiteBlock) => void;
};

type JsonTextareaProps = {
  value: unknown;
  onChange: (value: unknown) => void;
};

const textKeys = new Set(['text', 'content', 'description', 'summary', 'caption', 'code', 'messagePlaceholder']);

function frameFor(block: SiteBlock, device: DeviceMode): BlockLayoutFrame {
  return {
    ...defaultBlockLayout(block.blockType, block.sortOrder)[device]!,
    ...(block.layout?.[device] ?? {})
  };
}

function stylesFor(block: SiteBlock): BlockStyles {
  return {
    ...defaultBlockStyles(block.blockType),
    ...(block.styles ?? {})
  };
}

function numberValue(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function formatJson(value: unknown) {
  return JSON.stringify(value ?? null, null, 2);
}

function JsonTextarea({ value, onChange }: JsonTextareaProps) {
  const [raw, setRaw] = useState(formatJson(value));
  const [error, setError] = useState('');

  useEffect(() => {
    setRaw(formatJson(value));
    setError('');
  }, [value]);

  return (
    <label className="field json-field">
      <textarea
        value={raw}
        onChange={(event) => {
          const nextRaw = event.target.value;
          setRaw(nextRaw);
          try {
            const parsed = JSON.parse(nextRaw);
            setError('');
            onChange(parsed);
          } catch {
            setError('JSON 형식이 올바르면 자동 반영됩니다.');
          }
        }}
      />
      {error ? <small className="json-field-error">{error}</small> : null}
    </label>
  );
}

export function RightInspectorPanel({
  block,
  device,
  isSaving,
  onChange,
  onSave,
  onDelete,
  onDuplicate,
  onBringForward,
  onSendBackward,
  onToggleLock
}: RightInspectorPanelProps) {
  if (!block) {
    return (
      <section className="inspector-section">
        <p className="panel-label">선택된 객체</p>
        <p className="muted">캔버스의 블록을 선택하면 텍스트, 스타일, 위치를 편집할 수 있습니다.</p>
      </section>
    );
  }

  const selectedBlock = block;
  const content = selectedBlock.content ?? {};
  const settings = selectedBlock.settings ?? {};
  const styles = stylesFor(selectedBlock);
  const frame = frameFor(selectedBlock, device);

  function patch(next: Partial<SiteBlock>) {
    const updated: SiteBlock = { ...selectedBlock, ...next };
    console.log('[builder:inspector-block-change]', updated);
    onChange(updated);
  }

  function patchContent(key: string, value: unknown) {
    patch({ content: { ...content, [key]: value } });
  }

  function patchSettings(key: string, value: unknown) {
    patch({ settings: { ...settings, [key]: value } });
  }

  function patchStyle<K extends keyof BlockStyles>(key: K, value: BlockStyles[K]) {
    patch({ styles: { ...styles, [key]: value } });
  }

  function patchFrame<K extends keyof BlockLayoutFrame>(key: K, value: BlockLayoutFrame[K]) {
    patch({
      layout: {
        ...(selectedBlock.layout ?? {}),
        [device]: {
          ...frame,
          [key]: value
        }
      }
    });
  }

  return (
    <section className="inspector-section right-inspector">
      <div className="block-editor-card-header">
        <div>
          <p className="panel-label">선택된 객체</p>
          <h3>{blockLabel(selectedBlock.blockType)}</h3>
        </div>
        <button className="button button-ghost" type="button" onClick={() => onDelete(selectedBlock)}>
          삭제
        </button>
      </div>

      <div className="inspector-action-grid">
        <button className="button button-secondary" type="button" onClick={() => onDuplicate(selectedBlock)}>
          복제
        </button>
        <button className="button button-secondary" type="button" onClick={() => onBringForward(selectedBlock)}>
          앞으로
        </button>
        <button className="button button-secondary" type="button" onClick={() => onSendBackward(selectedBlock)}>
          뒤로
        </button>
        <button className="button button-secondary" type="button" onClick={() => onToggleLock(selectedBlock)}>
          {settings.locked ? '잠금 해제' : '잠금'}
        </button>
      </div>

      <label className="field">
        <span>블록 이름</span>
        <input value={stringValue(settings.blockName)} onChange={(event) => patchSettings('blockName', event.target.value)} />
      </label>

      <div className="builder-toggle-row">
        <label>
          <input type="checkbox" checked={selectedBlock.visible} onChange={(event) => patch({ visible: event.target.checked })} />
          공개
        </label>
        <label>
          <input type="checkbox" checked={Boolean(settings.locked)} onChange={(event) => patchSettings('locked', event.target.checked)} />
          위치 잠금
        </label>
      </div>

      <label className="field">
        <span>섹션 ID</span>
        <input value={selectedBlock.sectionId ?? ''} onChange={(event) => patch({ sectionId: event.target.value })} placeholder="hero, work, about" />
      </label>

      <label className="field">
        <span>정렬 순서</span>
        <input type="number" value={selectedBlock.sortOrder} onChange={(event) => patch({ sortOrder: Number(event.target.value) })} />
      </label>

      <div className="inspector-subsection">
        <h4>콘텐츠</h4>
        {Object.entries(content).map(([key, value]) => (
          <ContentField key={key} fieldKey={key} value={value} onChange={(nextValue) => patchContent(key, nextValue)} />
        ))}
      </div>

      <div className="inspector-subsection">
        <h4>스타일</h4>
        <div className="compact-field-grid">
          <label className="field">
            <span>글꼴</span>
            <input value={styles.fontFamily ?? ''} onChange={(event) => patchStyle('fontFamily', event.target.value)} />
          </label>
          <label className="field">
            <span>글자 크기</span>
            <input type="number" value={numberValue(styles.fontSize, 18)} onChange={(event) => patchStyle('fontSize', Number(event.target.value))} />
          </label>
          <label className="field">
            <span>글자 굵기</span>
            <input type="number" value={numberValue(styles.fontWeight, 500)} onChange={(event) => patchStyle('fontWeight', Number(event.target.value))} />
          </label>
          <label className="field">
            <span>글자색</span>
            <input type="color" value={styles.color ?? '#111111'} onChange={(event) => patchStyle('color', event.target.value)} />
          </label>
          <label className="field">
            <span>배경색</span>
            <input type="color" value={styles.backgroundColor === 'transparent' ? '#ffffff' : styles.backgroundColor ?? '#ffffff'} onChange={(event) => patchStyle('backgroundColor', event.target.value)} />
          </label>
          <label className="field">
            <span>안쪽 여백</span>
            <input type="number" value={numberValue(styles.padding, 0)} onChange={(event) => patchStyle('padding', Number(event.target.value))} />
          </label>
          <label className="field">
            <span>바깥 여백</span>
            <input type="number" value={numberValue(styles.margin, 0)} onChange={(event) => patchStyle('margin', Number(event.target.value))} />
          </label>
          <label className="field">
            <span>둥근 모서리</span>
            <input type="number" value={numberValue(styles.borderRadius, 8)} onChange={(event) => patchStyle('borderRadius', Number(event.target.value))} />
          </label>
          <label className="field">
            <span>투명도</span>
            <input type="number" min="0" max="1" step="0.05" value={numberValue(styles.opacity, 1)} onChange={(event) => patchStyle('opacity', Number(event.target.value))} />
          </label>
          <label className="field">
            <span>줄 간격</span>
            <input type="number" min="0.8" max="3" step="0.05" value={numberValue(styles.lineHeight, 1.6)} onChange={(event) => patchStyle('lineHeight', Number(event.target.value))} />
          </label>
          <label className="field">
            <span>테두리 두께</span>
            <input type="number" value={numberValue(styles.borderWidth, 0)} onChange={(event) => patchStyle('borderWidth', Number(event.target.value))} />
          </label>
          <label className="field">
            <span>테두리 색</span>
            <input type="color" value={styles.borderColor ?? '#111111'} onChange={(event) => patchStyle('borderColor', event.target.value)} />
          </label>
        </div>
        <label className="field">
          <span>테두리 CSS</span>
          <input value={styles.border ?? 'none'} onChange={(event) => patchStyle('border', event.target.value)} placeholder="1px solid #111111" />
        </label>
        <label className="field">
          <span>그림자 CSS</span>
          <input value={styles.boxShadow ?? 'none'} onChange={(event) => patchStyle('boxShadow', event.target.value)} placeholder="0 16px 40px rgba(0,0,0,0.12)" />
        </label>
        <label className="field">
          <span>버튼 스타일</span>
          <select value={styles.buttonStyle ?? 'solid'} onChange={(event) => patchStyle('buttonStyle', event.target.value as BlockStyles['buttonStyle'])}>
            <option value="solid">Solid</option>
            <option value="outline">Outline</option>
            <option value="ghost">Ghost</option>
            <option value="pill">Pill</option>
          </select>
        </label>
        <label className="field">
          <span>정렬</span>
          <select value={styles.textAlign ?? 'left'} onChange={(event) => patchStyle('textAlign', event.target.value as BlockStyles['textAlign'])}>
            <option value="left">왼쪽</option>
            <option value="center">가운데</option>
            <option value="right">오른쪽</option>
          </select>
        </label>
      </div>

      <div className="inspector-subsection">
        <h4>{device} 위치</h4>
        <div className="compact-field-grid">
          <label className="field">
            <span>X</span>
            <input type="number" value={frame.x} onChange={(event) => patchFrame('x', Number(event.target.value))} />
          </label>
          <label className="field">
            <span>Y</span>
            <input type="number" value={frame.y} onChange={(event) => patchFrame('y', Number(event.target.value))} />
          </label>
          <label className="field">
            <span>너비</span>
            <input type="number" value={frame.width} onChange={(event) => patchFrame('width', Number(event.target.value))} />
          </label>
          <label className="field">
            <span>높이</span>
            <input type="number" value={frame.height} onChange={(event) => patchFrame('height', Number(event.target.value))} />
          </label>
          <label className="field">
            <span>Z-index</span>
            <input type="number" value={frame.zIndex} onChange={(event) => patchFrame('zIndex', Number(event.target.value))} />
          </label>
        </div>
      </div>

      <button className="button button-primary inspector-save" type="button" disabled={isSaving} onClick={onSave}>
        {isSaving ? '저장 중...' : '전체 블록 저장'}
      </button>
    </section>
  );
}

function ContentField({ fieldKey, value, onChange }: { fieldKey: string; value: unknown; onChange: (value: unknown) => void }) {
  if (fieldKey === 'embedProvider') {
    return (
      <label className="field">
        <span>{fieldKey}</span>
        <select value={stringValue(value) || 'iframe'} onChange={(event) => onChange(event.target.value)}>
          {embedProviderOptions.map((provider) => (
            <option key={provider.key} value={provider.key}>
              {provider.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (typeof value === 'boolean') {
    return (
      <label className="builder-toggle-row">
        <span>{fieldKey}</span>
        <input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} />
      </label>
    );
  }

  if (typeof value === 'number') {
    return (
      <label className="field">
        <span>{fieldKey}</span>
        <input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} />
      </label>
    );
  }

  if (typeof value === 'string') {
    const multiline = textKeys.has(fieldKey) || value.length > 60;
    return (
      <label className="field">
        <span>{fieldKey}</span>
        {multiline ? (
          <textarea value={value} onChange={(event) => onChange(event.target.value)} />
        ) : (
          <input value={value} onChange={(event) => onChange(event.target.value)} />
        )}
      </label>
    );
  }

  if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
    return (
      <label className="field">
        <span>{fieldKey}</span>
        <input value={value.join(', ')} onChange={(event) => onChange(event.target.value.split(',').map((item) => item.trim()).filter(Boolean))} />
      </label>
    );
  }

  return (
    <div className="field">
      <span>{fieldKey}</span>
      <JsonTextarea value={value} onChange={onChange} />
    </div>
  );
}
