import type { SiteBlock } from '../types';
import { EditableBlockCanvas } from './EditableBlockCanvas';

type BlockRendererProps = {
  block: SiteBlock;
};

export function BlockRenderer({ block }: BlockRendererProps) {
  return (
    <div className="site-block-shell">
      <EditableBlockCanvas
        block={block}
        selected={false}
        showChrome={false}
        onSelect={() => undefined}
        onChange={() => undefined}
      />
    </div>
  );
}
