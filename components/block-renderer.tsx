"use client";

import {
  Fragment,
  type CSSProperties,
  type FocusEvent,
  type FormEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState
} from "react";
import Image from "next/image";
import Link from "next/link";

import {
  ImageLightbox,
  type LightboxImage
} from "@/components/image-lightbox";
import type { ProjectBlock, ProjectImage } from "@/lib/types";

export type ProjectBlockPath = Array<number | "left" | "right">;

type BlockRendererProps = {
  blocks: ProjectBlock[];
  editable?: boolean;
  selectedBlockPath?: ProjectBlockPath;
  onSelectBlock?: (path: ProjectBlockPath) => void;
  onChangeBlock?: (path: ProjectBlockPath, block: ProjectBlock) => void;
};

type ActiveLightbox = {
  images: LightboxImage[];
  index: number;
};

type InlineEditableTag = "cite" | "figcaption" | "h2" | "h3" | "p" | "span";

type InlineEditableTextProps = {
  as: InlineEditableTag;
  value: string;
  className?: string;
  style?: CSSProperties;
  multiline?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
};

const aspectRatioClass = {
  wide: "aspect-[16/9]",
  square: "aspect-square",
  portrait: "aspect-[4/5]"
};

function pathKey(path: ProjectBlockPath) {
  return path.join(".");
}

function normalizeOptionalText(value: string) {
  return value.trim() ? value : undefined;
}

export function InlineEditableText({
  as,
  value,
  className,
  style,
  multiline,
  placeholder,
  onChange,
  onFocus
}: InlineEditableTextProps) {
  const elementRef = useRef<HTMLElement | null>(null);
  const editableClassName = `${className ?? ""} min-h-[1em] rounded-sm outline-none transition empty:before:text-neutral-400 empty:before:content-[attr(data-placeholder)] focus-visible:ring-2 focus-visible:ring-emerald-500/30`;

  useEffect(() => {
    const element = elementRef.current;

    if (!element || document.activeElement === element) {
      return;
    }

    if (element.textContent !== value) {
      element.textContent = value;
    }
  }, [value]);

  const editableProps: HTMLAttributes<HTMLElement> & {
    "data-placeholder": string;
  } = {
    "aria-label": placeholder,
    "aria-multiline": multiline || undefined,
    className: editableClassName,
    contentEditable: true,
    "data-placeholder": placeholder ?? "",
    dir: "ltr",
    style,
    onBlur: (event: FocusEvent<HTMLElement>) => {
      const nextValue = event.currentTarget.textContent ?? "";

      if (nextValue !== value) {
        onChange(nextValue);
      }
    },
    onFocus,
    onInput: (event: FormEvent<HTMLElement>) =>
      onChange(event.currentTarget.textContent ?? ""),
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === "Enter" && event.shiftKey) {
        event.preventDefault();

        const selection = window.getSelection();

        if (!selection || selection.rangeCount === 0) {
          return;
        }

        const range = selection.getRangeAt(0);
        range.deleteContents();

        const lineBreak = document.createTextNode("\n");
        range.insertNode(lineBreak);
        range.setStartAfter(lineBreak);
        range.collapse(true);

        selection.removeAllRanges();
        selection.addRange(range);
        onChange(event.currentTarget.textContent ?? "");
        return;
      }

      if (!multiline && event.key === "Enter") {
        event.preventDefault();
        event.currentTarget.blur();
      }
    },
    role: "textbox",
    suppressContentEditableWarning: true
  };

  const setElementRef = (element: HTMLElement | null) => {
    elementRef.current = element;
  };

  switch (as) {
    case "cite":
      return <cite {...editableProps} ref={setElementRef} />;
    case "figcaption":
      return <figcaption {...editableProps} ref={setElementRef} />;
    case "h2":
      return <h2 {...editableProps} ref={setElementRef} />;
    case "h3":
      return <h3 {...editableProps} ref={setElementRef} />;
    case "p":
      return <p {...editableProps} ref={setElementRef} />;
    case "span":
      return <span {...editableProps} ref={setElementRef} />;
  }
}

export function BlockRenderer({
  blocks,
  editable,
  selectedBlockPath,
  onSelectBlock,
  onChangeBlock
}: BlockRendererProps) {
  const [lightbox, setLightbox] = useState<ActiveLightbox | null>(null);

  const selectedKey = selectedBlockPath ? pathKey(selectedBlockPath) : "";

  const openLightbox = (images: LightboxImage[], index: number) => {
    if (!editable) {
      setLightbox({ images, index });
    }
  };

  const selectBlock = (path: ProjectBlockPath) => {
    if (editable) {
      onSelectBlock?.(path);
    }
  };

  const changeBlock = (path: ProjectBlockPath, block: ProjectBlock) => {
    onChangeBlock?.(path, block);
  };

  const wrapEditableBlock = (
    children: ReactNode,
    path: ProjectBlockPath,
    key: string
  ) => {
    if (!editable) {
      return <Fragment key={key}>{children}</Fragment>;
    }

    const selected = selectedKey === pathKey(path);

    return (
      <div
        className={`relative -m-1 rounded-md p-1 transition ${
          selected
            ? "ring-2 ring-emerald-500/70 ring-offset-2 ring-offset-white dark:ring-offset-neutral-950"
            : "ring-1 ring-transparent hover:ring-neutral-300 dark:hover:ring-neutral-700"
        }`}
        data-project-block={pathKey(path)}
        key={key}
        onClick={(event) => {
          event.stopPropagation();
          selectBlock(path);
        }}
        onMouseUp={(event) => {
          event.stopPropagation();
          selectBlock(path);
        }}
        onTouchEnd={(event) => {
          event.stopPropagation();
          selectBlock(path);
        }}
      >
        {children}
      </div>
    );
  };

  const renderImageFigure = (
    image: ProjectImage,
    images: ProjectImage[],
    index: number,
    aspectRatio: keyof typeof aspectRatioClass = "wide",
    onChangeCaption?: (caption: string) => void
  ) => (
    <figure className="grid gap-3">
      <button
        aria-label={`이미지 크게 보기: ${image.alt}`}
        className={`group overflow-hidden rounded-md border border-neutral-200 bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-500 dark:border-neutral-800 dark:bg-neutral-900 ${aspectRatioClass[aspectRatio]}`}
        onClick={() => openLightbox(images, index)}
        type="button"
      >
        <Image
          alt={image.alt}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          height={900}
          sizes="(min-width: 768px) 50vw, 100vw"
          src={image.src}
          unoptimized
          width={1200}
        />
      </button>
      {editable && onChangeCaption ? (
        <InlineEditableText
          as="figcaption"
          className="text-sm text-neutral-500 dark:text-neutral-400"
          onChange={onChangeCaption}
          placeholder="이미지 설명"
          value={image.caption ?? ""}
        />
      ) : image.caption ? (
        <figcaption className="text-sm text-neutral-500 dark:text-neutral-400">
          {image.caption}
        </figcaption>
      ) : null}
    </figure>
  );

  const renderBlock = (
    block: ProjectBlock,
    key: string,
    path: ProjectBlockPath
  ) => {
    switch (block.type) {
      case "heading": {
        const HeadingTag = block.level === 3 ? "h3" : "h2";
        const className =
          block.level === 3
            ? "mt-8 text-2xl font-semibold text-neutral-950 dark:text-neutral-50"
            : "mt-14 text-3xl font-semibold text-neutral-950 dark:text-neutral-50";

        return wrapEditableBlock(
          editable ? (
            <InlineEditableText
              as={HeadingTag}
              className={className}
              onChange={(text) => changeBlock(path, { ...block, text })}
              onFocus={() => selectBlock(path)}
              placeholder="제목 입력"
              value={block.text}
            />
          ) : (
            <HeadingTag className={className}>{block.text}</HeadingTag>
          ),
          path,
          key
        );
      }
      case "paragraph":
        return wrapEditableBlock(
          editable ? (
            <InlineEditableText
              as="p"
              className="max-w-3xl whitespace-pre-line text-base leading-8 text-neutral-700 dark:text-neutral-300"
              multiline
              onChange={(text) => changeBlock(path, { ...block, text })}
              onFocus={() => selectBlock(path)}
              placeholder="본문 입력"
              value={block.text}
            />
          ) : (
            <p className="max-w-3xl whitespace-pre-line text-base leading-8 text-neutral-700 dark:text-neutral-300">
              {block.text}
            </p>
          ),
          path,
          key
        );
      case "image": {
        const image = {
          src: block.src,
          alt: block.alt,
          caption: block.caption
        };

        return wrapEditableBlock(
          <div className="my-8">
            {renderImageFigure(
              image,
              [image],
              0,
              block.aspectRatio ?? "wide",
              (caption) =>
                changeBlock(path, {
                  ...block,
                  caption: normalizeOptionalText(caption)
                })
            )}
          </div>,
          path,
          key
        );
      }
      case "imageGrid": {
        const columns =
          block.columns === 3 ? "md:grid-cols-3" : "md:grid-cols-2";

        return wrapEditableBlock(
          <div className={`my-8 grid gap-4 ${columns}`}>
            {block.images.map((image, index) => (
              <div key={`${key}-${image.src}-${index}`}>
                {renderImageFigure(image, block.images, index, "square", (caption) =>
                  changeBlock(path, {
                    ...block,
                    images: block.images.map((currentImage, currentIndex) =>
                      currentIndex === index
                        ? {
                            ...currentImage,
                            caption: normalizeOptionalText(caption)
                          }
                        : currentImage
                    )
                  })
                )}
              </div>
            ))}
          </div>,
          path,
          key
        );
      }
      case "quote":
        return wrapEditableBlock(
          <blockquote className="my-10 max-w-3xl border-l-2 border-emerald-600 pl-6 text-2xl leading-10 text-neutral-900 dark:border-emerald-400 dark:text-neutral-100">
            {editable ? (
              <InlineEditableText
                as="p"
                multiline
                onChange={(quote) => changeBlock(path, { ...block, quote })}
                onFocus={() => selectBlock(path)}
                placeholder="인용문 입력"
                value={block.quote}
              />
            ) : (
              <p>{block.quote}</p>
            )}
            {editable ? (
              <InlineEditableText
                as="cite"
                className="mt-4 block text-sm not-italic text-neutral-500 dark:text-neutral-400"
                onChange={(cite) =>
                  changeBlock(path, {
                    ...block,
                    cite: normalizeOptionalText(cite)
                  })
                }
                onFocus={() => selectBlock(path)}
                placeholder="출처"
                value={block.cite ?? ""}
              />
            ) : block.cite ? (
              <cite className="mt-4 block text-sm not-italic text-neutral-500 dark:text-neutral-400">
                {block.cite}
              </cite>
            ) : null}
          </blockquote>,
          path,
          key
        );
      case "button": {
        const variant = block.variant ?? "primary";
        const buttonClass =
          variant === "primary"
            ? "border-neutral-950 bg-neutral-950 text-white hover:bg-neutral-800 dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-950"
            : variant === "secondary"
              ? "border-neutral-200 bg-white text-neutral-900 hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
              : "border-transparent bg-transparent px-0 text-neutral-950 underline-offset-4 hover:underline dark:text-neutral-50";
        const className = `inline-flex min-h-10 items-center rounded-md border px-4 py-2 text-sm font-medium transition ${buttonClass}`;

        return wrapEditableBlock(
          <div className="my-8">
            {editable ? (
              <span className={className}>
                <InlineEditableText
                  as="span"
                  onChange={(label) => changeBlock(path, { ...block, label })}
                  onFocus={() => selectBlock(path)}
                  placeholder="버튼 문구"
                  value={block.label}
                />
              </span>
            ) : (
              <Link className={className} href={block.href}>
                {block.label}
              </Link>
            )}
          </div>,
          path,
          key
        );
      }
      case "divider":
        return wrapEditableBlock(
          <div
            className={
              block.spacing === "lg"
                ? "py-10"
                : block.spacing === "sm"
                  ? "py-3"
                  : "py-6"
            }
          >
            {block.style === "blank" ? null : (
              <div
                className={`border-t border-neutral-200 dark:border-neutral-800 ${
                  block.style === "dashed" ? "border-dashed" : ""
                }`}
              />
            )}
          </div>,
          path,
          key
        );
      case "embed":
        return wrapEditableBlock(
          <div
            className={`my-8 overflow-hidden rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 ${
              block.ratio === "square" ? "aspect-square" : "aspect-video"
            }`}
          >
            <iframe
              className="h-full w-full"
              src={block.url}
              title={block.provider || "임베드 콘텐츠"}
            />
          </div>,
          path,
          key
        );
      case "spacer":
        return wrapEditableBlock(
          <div aria-hidden style={{ height: block.height ?? 48 }} />,
          path,
          key
        );
      case "twoColumn":
        return wrapEditableBlock(
          <div className="my-10 grid gap-8 border-y border-neutral-200 py-8 dark:border-neutral-800 md:grid-cols-2">
            <div className="grid content-start gap-5">
              {block.left.map((child, index) =>
                renderBlock(child, `${key}-left-${index}`, [
                  ...path,
                  "left",
                  index
                ])
              )}
            </div>
            <div className="grid content-start gap-5">
              {block.right.map((child, index) =>
                renderBlock(child, `${key}-right-${index}`, [
                  ...path,
                  "right",
                  index
                ])
              )}
            </div>
          </div>,
          path,
          key
        );
      case "stats":
        return wrapEditableBlock(
          <div className="my-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {block.items.map((item, index) => (
              <div
                className="rounded-md border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
                key={`${item.label}-${index}`}
              >
                {editable ? (
                  <InlineEditableText
                    as="p"
                    className="text-3xl font-semibold text-neutral-950 dark:text-neutral-50"
                    onChange={(value) =>
                      changeBlock(path, {
                        ...block,
                        items: block.items.map((currentItem, currentIndex) =>
                          currentIndex === index
                            ? { ...currentItem, value }
                            : currentItem
                        )
                      })
                    }
                    onFocus={() => selectBlock(path)}
                    placeholder="값"
                    value={item.value}
                  />
                ) : (
                  <p className="text-3xl font-semibold text-neutral-950 dark:text-neutral-50">
                    {item.value}
                  </p>
                )}
                {editable ? (
                  <InlineEditableText
                    as="p"
                    className="mt-2 text-sm font-medium text-neutral-800 dark:text-neutral-200"
                    onChange={(label) =>
                      changeBlock(path, {
                        ...block,
                        items: block.items.map((currentItem, currentIndex) =>
                          currentIndex === index
                            ? { ...currentItem, label }
                            : currentItem
                        )
                      })
                    }
                    onFocus={() => selectBlock(path)}
                    placeholder="라벨"
                    value={item.label}
                  />
                ) : (
                  <p className="mt-2 text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    {item.label}
                  </p>
                )}
                {editable ? (
                  <InlineEditableText
                    as="p"
                    className="mt-3 text-sm leading-6 text-neutral-500 dark:text-neutral-400"
                    multiline
                    onChange={(description) =>
                      changeBlock(path, {
                        ...block,
                        items: block.items.map((currentItem, currentIndex) =>
                          currentIndex === index
                            ? {
                                ...currentItem,
                                description: normalizeOptionalText(description)
                              }
                            : currentItem
                        )
                      })
                    }
                    onFocus={() => selectBlock(path)}
                    placeholder="설명"
                    value={item.description ?? ""}
                  />
                ) : item.description ? (
                  <p className="mt-3 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                    {item.description}
                  </p>
                ) : null}
              </div>
            ))}
          </div>,
          path,
          key
        );
      case "process":
        return wrapEditableBlock(
          <ol className="my-10 grid gap-4">
            {block.steps.map((step, index) => (
              <li
                className="grid gap-4 border-t border-neutral-200 pt-5 dark:border-neutral-800 md:grid-cols-[64px_1fr]"
                key={`${step.title}-${index}`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-neutral-950 text-sm font-semibold text-white dark:bg-neutral-100 dark:text-neutral-950">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  {editable ? (
                    <InlineEditableText
                      as="h3"
                      className="text-lg font-semibold text-neutral-950 dark:text-neutral-50"
                      onChange={(title) =>
                        changeBlock(path, {
                          ...block,
                          steps: block.steps.map((currentStep, currentIndex) =>
                            currentIndex === index
                              ? { ...currentStep, title }
                              : currentStep
                          )
                        })
                      }
                      onFocus={() => selectBlock(path)}
                      placeholder="단계 제목"
                      value={step.title}
                    />
                  ) : (
                    <h3 className="text-lg font-semibold text-neutral-950 dark:text-neutral-50">
                      {step.title}
                    </h3>
                  )}
                  {editable ? (
                    <InlineEditableText
                      as="p"
                      className="mt-2 max-w-3xl text-sm leading-7 text-neutral-600 dark:text-neutral-400"
                      multiline
                      onChange={(description) =>
                        changeBlock(path, {
                          ...block,
                          steps: block.steps.map((currentStep, currentIndex) =>
                            currentIndex === index
                              ? { ...currentStep, description }
                              : currentStep
                          )
                        })
                      }
                      onFocus={() => selectBlock(path)}
                      placeholder="단계 설명"
                      value={step.description}
                    />
                  ) : (
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-neutral-600 dark:text-neutral-400">
                      {step.description}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>,
          path,
          key
        );
      case "result":
        return wrapEditableBlock(
          <section className="my-10 border-l-2 border-blue-600 pl-6 dark:border-blue-400">
            {editable ? (
              <InlineEditableText
                as="h3"
                className="text-xl font-semibold text-neutral-950 dark:text-neutral-50"
                onChange={(title) => changeBlock(path, { ...block, title })}
                onFocus={() => selectBlock(path)}
                placeholder="결과 제목"
                value={block.title}
              />
            ) : (
              <h3 className="text-xl font-semibold text-neutral-950 dark:text-neutral-50">
                {block.title}
              </h3>
            )}
            {editable ? (
              <InlineEditableText
                as="p"
                className="mt-4 whitespace-pre-line text-sm leading-7 text-neutral-700 dark:text-neutral-300"
                multiline
                onChange={(items) =>
                  changeBlock(path, {
                    ...block,
                    items: items
                      .split("\n")
                      .map((item) => item.trim())
                      .filter(Boolean)
                  })
                }
                onFocus={() => selectBlock(path)}
                placeholder="결과를 줄바꿈으로 입력"
                value={block.items.join("\n")}
              />
            ) : (
              <ul className="mt-4 grid gap-2 text-sm leading-7 text-neutral-700 dark:text-neutral-300">
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>,
          path,
          key
        );
      default:
        return null;
    }
  };

  return (
    <div className="grid gap-6">
      {blocks.map((block, index) => renderBlock(block, `block-${index}`, [index]))}
      <ImageLightbox
        activeIndex={lightbox?.index ?? null}
        images={lightbox?.images ?? []}
        onClose={() => setLightbox(null)}
        onSelect={(index) =>
          setLightbox((current) => (current ? { ...current, index } : current))
        }
      />
    </div>
  );
}
