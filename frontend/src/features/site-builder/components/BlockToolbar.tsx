import type { SiteBlock } from '../types';

type BlockToolbarProps = {
  block: SiteBlock;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onToggleLock: () => void;
};

export function BlockToolbar({ block, onDuplicate, onDelete, onBringForward, onSendBackward, onToggleLock }: BlockToolbarProps) {
  const locked = Boolean(block.settings?.locked);

  return (
    <div className="block-toolbar" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>
      <button type="button" onClick={onDuplicate}>복제</button>
      <button type="button" onClick={onBringForward}>앞으로</button>
      <button type="button" onClick={onSendBackward}>뒤로</button>
      <button type="button" onClick={onToggleLock}>{locked ? '잠금 해제' : '잠금'}</button>
      <button type="button" onClick={onDelete}>삭제</button>
    </div>
  );
}
