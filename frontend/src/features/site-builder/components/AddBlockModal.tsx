import { blockOptions, type BlockCategory } from '../blockCatalog';
import type { BlockType } from '../types';

type AddBlockModalProps = {
  open: boolean;
  isAdding: boolean;
  onClose: () => void;
  onAdd: (type: BlockType) => void;
};

const categoryLabels: Record<BlockCategory, string> = {
  basic: '기본 블록',
  advanced: '고급 블록'
};

export function AddBlockModal({ open, isAdding, onClose, onAdd }: AddBlockModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="add-block-backdrop" onClick={onClose}>
      <section className="add-block-modal" onClick={(event) => event.stopPropagation()}>
        <header className="add-block-modal-header">
          <div>
            <p className="panel-label">블록 추가</p>
            <h2>캔버스에 객체 추가</h2>
          </div>
          <button className="button button-ghost" type="button" onClick={onClose}>닫기</button>
        </header>
        {(['basic', 'advanced'] as BlockCategory[]).map((category) => (
          <div key={category} className="add-block-group">
            <h3>{categoryLabels[category]}</h3>
            <div className="add-block-grid">
              {blockOptions
                .filter((option) => option.category === category)
                .map((option) => (
                  <button
                    key={option.type}
                    type="button"
                    disabled={isAdding}
                    onClick={() => {
                      onAdd(option.type);
                      onClose();
                    }}
                  >
                    <strong>{option.label}</strong>
                    <span>{option.description}</span>
                  </button>
                ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
