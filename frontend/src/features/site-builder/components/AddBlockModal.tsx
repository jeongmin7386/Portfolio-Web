import { useState } from 'react';
import { blockOptions, type BlockCategory } from '../blockCatalog';
import type { BlockType } from '../types';

type AddBlockModalProps = {
  open: boolean;
  isAdding: boolean;
  onClose: () => void;
  onAdd: (type: BlockType) => void;
};

const categories: BlockCategory[] = ['basic', 'media', 'portfolio', 'advanced'];

const categoryLabels: Record<BlockCategory, string> = {
  basic: '기본 블록',
  media: '미디어 블록',
  portfolio: '포트폴리오 블록',
  advanced: '고급 블록'
};

export function AddBlockModal({ open, isAdding, onClose, onAdd }: AddBlockModalProps) {
  const [activeCategory, setActiveCategory] = useState<BlockCategory>('basic');

  if (!open) {
    return null;
  }

  const options = blockOptions.filter((option) => option.category === activeCategory);

  return (
    <div className="add-block-backdrop" onClick={onClose}>
      <section className="add-block-modal" onClick={(event) => event.stopPropagation()}>
        <header className="add-block-modal-header">
          <div>
            <p className="panel-label">블록 추가</p>
            <h2>캔버스에 객체 추가</h2>
          </div>
          <button className="button button-ghost" type="button" onClick={onClose}>
            닫기
          </button>
        </header>

        <div className="add-block-tabs" role="tablist" aria-label="블록 종류">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={activeCategory === category ? 'active' : ''}
              onClick={() => setActiveCategory(category)}
            >
              {categoryLabels[category]}
            </button>
          ))}
        </div>

        <div className="add-block-group">
          <h3>{categoryLabels[activeCategory]}</h3>
          <div className="add-block-grid">
            {options.map((option) => (
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
      </section>
    </div>
  );
}
