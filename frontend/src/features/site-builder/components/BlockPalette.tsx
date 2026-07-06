import type { BlockType } from '../types';
import { blockOptions } from '../blockCatalog';

type BlockPaletteProps = {
  isAdding: boolean;
  onAdd: (type: BlockType) => void;
};

export function BlockPalette({ isAdding, onAdd }: BlockPaletteProps) {
  return (
    <div className="block-palette">
      {blockOptions.map((option) => (
        <button key={option.type} type="button" disabled={isAdding} onClick={() => onAdd(option.type)}>
          <strong>{option.label}</strong>
          <span>{option.description}</span>
        </button>
      ))}
    </div>
  );
}
