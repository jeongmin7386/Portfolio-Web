import { useEffect, useMemo, useState } from 'react';
import { defaultBlockLayout, defaultBlockStyles } from '../blockCatalog';
import type { DeviceMode, SiteBlock } from '../types';
import { BlockRenderer } from './BlockRenderer';

type PublicBlockCanvasProps = {
  blocks: SiteBlock[];
};

function currentDevice(): DeviceMode {
  if (typeof window === 'undefined') {
    return 'desktop';
  }
  if (window.innerWidth <= 640) {
    return 'mobile';
  }
  if (window.innerWidth <= 960) {
    return 'tablet';
  }
  return 'desktop';
}

export function PublicBlockCanvas({ blocks }: PublicBlockCanvasProps) {
  const [device, setDevice] = useState<DeviceMode>(() => currentDevice());
  const visibleBlocks = blocks.filter((block) => block.visible);
  const frames = useMemo(
    () =>
      visibleBlocks.map((block, index) => ({
        block: {
          ...block,
          styles: {
            ...defaultBlockStyles(block.blockType),
            ...(block.styles ?? {})
          }
        },
        frame: {
          ...defaultBlockLayout(block.blockType, index)[device]!,
          ...(block.layout?.[device] ?? {})
        }
      })),
    [device, visibleBlocks]
  );
  const canvasHeight = Math.max(320, ...frames.map(({ frame }) => frame.y + frame.height + 96));

  useEffect(() => {
    function handleResize() {
      setDevice(currentDevice());
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!frames.length) {
    return null;
  }

  return (
    <div className={`public-freeform-canvas public-freeform-${device}`} style={{ minHeight: canvasHeight }}>
      {frames.map(({ block, frame }) => (
        <div
          key={block.id}
          className="public-freeform-frame"
          style={{
            left: frame.x,
            top: frame.y,
            width: frame.width,
            minHeight: frame.height,
            zIndex: frame.zIndex
          }}
        >
          <BlockRenderer block={block} />
        </div>
      ))}
    </div>
  );
}
