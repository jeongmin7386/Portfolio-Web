import { type CSSProperties, type PointerEvent, useMemo } from 'react';
import { defaultBlockLayout } from '../blockCatalog';
import type { DeviceMode, SiteBlock, BlockLayoutFrame } from '../types';
import { BlockToolbar } from './BlockToolbar';
import { EditableBlockCanvas } from './EditableBlockCanvas';

type EditorCanvasProps = {
  blocks: SiteBlock[];
  selectedBlockId: number | null;
  device: DeviceMode;
  snapToGrid: boolean;
  onSelect: (blockId: number) => void;
  onChange: (block: SiteBlock) => void;
  onDuplicate: (block: SiteBlock) => void;
  onDelete: (block: SiteBlock) => void;
  onBringForward: (block: SiteBlock) => void;
  onSendBackward: (block: SiteBlock) => void;
  onToggleLock: (block: SiteBlock) => void;
  onOpenAddBlock: () => void;
};

const GRID_SIZE = 8;

function frameFor(block: SiteBlock, device: DeviceMode, index: number): BlockLayoutFrame {
  const fallback = defaultBlockLayout(block.blockType, index)[device]!;
  return {
    ...fallback,
    ...(block.layout?.[device] ?? {})
  };
}

function shouldIgnoreDrag(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return Boolean(target.closest('input, textarea, select, button, a, [contenteditable="true"]'));
}

function snap(value: number, enabled: boolean) {
  return enabled ? Math.round(value / GRID_SIZE) * GRID_SIZE : value;
}

export function EditorCanvas({
  blocks,
  selectedBlockId,
  device,
  snapToGrid,
  onSelect,
  onChange,
  onDuplicate,
  onDelete,
  onBringForward,
  onSendBackward,
  onToggleLock,
  onOpenAddBlock
}: EditorCanvasProps) {
  const visibleBlocks = blocks.filter((block) => block.visible);
  const frames = useMemo(
    () =>
      visibleBlocks.map((block, index) => ({
        block,
        frame: frameFor(block, device, index)
      })),
    [visibleBlocks, device]
  );
  const canvasHeight = Math.max(720, ...frames.map(({ frame }) => frame.y + frame.height + 160));

  function patchFrame(block: SiteBlock, frame: BlockLayoutFrame) {
    const next = {
      ...block,
      layout: {
        ...(block.layout ?? {}),
        [device]: frame
      }
    };
    console.log('[builder:canvas-layout-change]', { blockId: block.id, device, frame, next });
    onChange(next);
  }

  function startDrag(event: PointerEvent<HTMLDivElement>, block: SiteBlock, frame: BlockLayoutFrame) {
    onSelect(block.id);
    if (Boolean(block.settings?.locked) || shouldIgnoreDrag(event.target)) {
      return;
    }

    const startX = event.clientX;
    const startY = event.clientY;
    const origin = { ...frame };

    function move(pointerEvent: globalThis.PointerEvent) {
      const nextFrame = {
        ...origin,
        x: snap(origin.x + pointerEvent.clientX - startX, snapToGrid),
        y: snap(origin.y + pointerEvent.clientY - startY, snapToGrid)
      };
      patchFrame(block, nextFrame);
    }

    function stop() {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    }

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
  }

  function startResize(event: PointerEvent<HTMLButtonElement>, block: SiteBlock, frame: BlockLayoutFrame) {
    event.stopPropagation();
    onSelect(block.id);
    if (Boolean(block.settings?.locked)) {
      return;
    }

    const startX = event.clientX;
    const startY = event.clientY;
    const origin = { ...frame };

    function move(pointerEvent: globalThis.PointerEvent) {
      const nextFrame = {
        ...origin,
        width: Math.max(80, snap(origin.width + pointerEvent.clientX - startX, snapToGrid)),
        height: Math.max(48, snap(origin.height + pointerEvent.clientY - startY, snapToGrid))
      };
      patchFrame(block, nextFrame);
    }

    function stop() {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    }

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
  }

  return (
    <div className={`editor-canvas-freeform editor-canvas-${device}`} style={{ minHeight: canvasHeight }}>
      <button className="canvas-add-center" type="button" onClick={onOpenAddBlock}>
        <span>+</span>
        블록 추가
      </button>

      {!frames.length ? (
        <div className="builder-empty-preview freeform-empty">
          <p className="eyebrow">빈 캔버스</p>
          <h3>가운데 + 버튼으로 첫 블록을 추가하세요.</h3>
        </div>
      ) : null}

      {frames.map(({ block, frame }) => {
        const selected = selectedBlockId === block.id;
        const style: CSSProperties = {
          left: frame.x,
          top: frame.y,
          width: frame.width,
          height: frame.height,
          zIndex: frame.zIndex
        };
        return (
          <div
            key={block.id}
            className={`freeform-block-frame ${selected ? 'selected' : ''} ${block.settings?.locked ? 'locked' : ''}`}
            style={style}
            onPointerDown={(event) => startDrag(event, block, frame)}
          >
            {selected ? (
              <BlockToolbar
                block={block}
                onDuplicate={() => onDuplicate(block)}
                onDelete={() => onDelete(block)}
                onBringForward={() => onBringForward(block)}
                onSendBackward={() => onSendBackward(block)}
                onToggleLock={() => onToggleLock(block)}
              />
            ) : null}
            <EditableBlockCanvas
              block={block}
              selected={selected}
              onSelect={() => onSelect(block.id)}
              onChange={onChange}
            />
            {selected ? (
              <button
                className="freeform-resize-handle"
                type="button"
                aria-label="크기 조절"
                onPointerDown={(event) => startResize(event, block, frame)}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
