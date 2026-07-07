import { useEffect, useMemo, useState } from 'react';
import { defaultBlockLayout, defaultBlockStyles, defaultSection } from '../blockCatalog';
import type { DeviceMode, SiteBlock, SiteSection } from '../types';
import { BlockRenderer } from './BlockRenderer';

type PublicBlockCanvasProps = {
  blocks: SiteBlock[];
  sections?: SiteSection[];
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

export function PublicBlockCanvas({ blocks, sections }: PublicBlockCanvasProps) {
  const [device, setDevice] = useState<DeviceMode>(() => currentDevice());
  const visibleBlocks = useMemo(() => blocks.filter((block) => block.visible), [blocks]);
  const normalizedSections = useMemo(() => normalizeSections(sections, visibleBlocks), [sections, visibleBlocks]);
  const sectionFrames = useMemo(
    () =>
      normalizedSections.map((section) => {
        const sectionBlocks = visibleBlocks.filter((block) => blockSectionId(block) === section.id);
        const frames = sectionBlocks.map((block, index) => ({
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
        }));
        return { section, frames };
      }),
    [device, normalizedSections, visibleBlocks]
  );

  useEffect(() => {
    function handleResize() {
      setDevice(currentDevice());
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!visibleBlocks.length) {
    return null;
  }

  return (
    <>
      {sectionFrames.map(({ section, frames }) => {
        if (!frames.length) {
          return null;
        }
        const canvasHeight = Math.max(section.styles?.minHeight ?? 320, ...frames.map(({ frame }) => frame.y + frame.height + 96));
        return (
          <section key={section.id} className="public-section-renderer" style={sectionStyle(section)}>
            {section.styles?.overlayColor && section.styles.overlayColor !== 'rgba(0,0,0,0)' ? (
              <div className="public-section-overlay" style={{ background: section.styles.overlayColor }} />
            ) : null}
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
          </section>
        );
      })}
    </>
  );
}

function blockSectionId(block: SiteBlock) {
  return block.sectionId || 'section-main';
}

function normalizeSections(sections: SiteSection[] | undefined, blocks: SiteBlock[]) {
  const normalized = (sections?.length ? sections : [defaultSection('section-main', 'Main Section', 0)]).map((section, index) => ({
    ...defaultSection(section.id || `section-${index + 1}`, section.name || `Section ${index + 1}`, section.sortOrder ?? index),
    ...section,
    styles: {
      ...defaultSection().styles,
      ...(section.styles ?? {})
    }
  }));
  const seen = new Set(normalized.map((section) => section.id));
  blocks.forEach((block) => {
    const sectionId = blockSectionId(block);
    if (!seen.has(sectionId)) {
      seen.add(sectionId);
      normalized.push(defaultSection(sectionId, sectionId, normalized.length));
    }
  });
  return normalized.sort((first, second) => first.sortOrder - second.sortOrder);
}

function sectionStyle(section: SiteSection) {
  const styles = {
    ...defaultSection().styles,
    ...(section.styles ?? {})
  };
  return {
    backgroundColor: styles.backgroundColor,
    backgroundImage: styles.backgroundImage ? `url("${styles.backgroundImage}")` : undefined,
    backgroundSize: styles.backgroundSize,
    backgroundPosition: styles.backgroundPosition,
    minHeight: styles.minHeight,
    padding: styles.padding
  };
}
