"use client";

import { useState } from "react";
import Image from "next/image";

import {
  ImageLightbox,
  type LightboxImage
} from "@/components/image-lightbox";
import type { ProjectBlock, ProjectImage } from "@/lib/types";

type BlockRendererProps = {
  blocks: ProjectBlock[];
};

type ActiveLightbox = {
  images: LightboxImage[];
  index: number;
};

const aspectRatioClass = {
  wide: "aspect-[16/9]",
  square: "aspect-square",
  portrait: "aspect-[4/5]"
};

export function BlockRenderer({ blocks }: BlockRendererProps) {
  const [lightbox, setLightbox] = useState<ActiveLightbox | null>(null);

  const openLightbox = (images: LightboxImage[], index: number) => {
    setLightbox({ images, index });
  };

  const renderImageButton = (
    image: ProjectImage,
    images: ProjectImage[],
    index: number,
    aspectRatio: keyof typeof aspectRatioClass = "wide"
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
      {image.caption ? (
        <figcaption className="text-sm text-neutral-500 dark:text-neutral-400">
          {image.caption}
        </figcaption>
      ) : null}
    </figure>
  );

  const renderBlock = (block: ProjectBlock, key: string) => {
    switch (block.type) {
      case "heading": {
        const HeadingTag = block.level === 3 ? "h3" : "h2";

        return (
          <HeadingTag
            className={
              block.level === 3
                ? "mt-8 text-2xl font-semibold text-neutral-950 dark:text-neutral-50"
                : "mt-14 text-3xl font-semibold text-neutral-950 dark:text-neutral-50"
            }
            key={key}
          >
            {block.text}
          </HeadingTag>
        );
      }
      case "paragraph":
        return (
          <p
            className="max-w-3xl whitespace-pre-line text-base leading-8 text-neutral-700 dark:text-neutral-300"
            key={key}
          >
            {block.text}
          </p>
        );
      case "image": {
        const image = {
          src: block.src,
          alt: block.alt,
          caption: block.caption
        };

        return (
          <div className="my-8" key={key}>
            {renderImageButton(
              image,
              [image],
              0,
              block.aspectRatio ?? "wide"
            )}
          </div>
        );
      }
      case "imageGrid": {
        const columns =
          block.columns === 3 ? "md:grid-cols-3" : "md:grid-cols-2";

        return (
          <div className={`my-8 grid gap-4 ${columns}`} key={key}>
            {block.images.map((image, index) => (
              <div key={`${key}-${image.src}`}>
                {renderImageButton(image, block.images, index, "square")}
              </div>
            ))}
          </div>
        );
      }
      case "quote":
        return (
          <blockquote
            className="my-10 max-w-3xl border-l-2 border-emerald-600 pl-6 text-2xl leading-10 text-neutral-900 dark:border-emerald-400 dark:text-neutral-100"
            key={key}
          >
            <p>{block.quote}</p>
            {block.cite ? (
              <cite className="mt-4 block text-sm not-italic text-neutral-500 dark:text-neutral-400">
                {block.cite}
              </cite>
            ) : null}
          </blockquote>
        );
      case "twoColumn":
        return (
          <div
            className="my-10 grid gap-8 border-y border-neutral-200 py-8 dark:border-neutral-800 md:grid-cols-2"
            key={key}
          >
            <div className="grid content-start gap-5">
              {block.left.map((child, index) =>
                renderBlock(child, `${key}-left-${index}`)
              )}
            </div>
            <div className="grid content-start gap-5">
              {block.right.map((child, index) =>
                renderBlock(child, `${key}-right-${index}`)
              )}
            </div>
          </div>
        );
      case "stats":
        return (
          <div
            className="my-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            key={key}
          >
            {block.items.map((item) => (
              <div
                className="rounded-md border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
                key={item.label}
              >
                <p className="text-3xl font-semibold text-neutral-950 dark:text-neutral-50">
                  {item.value}
                </p>
                <p className="mt-2 text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  {item.label}
                </p>
                {item.description ? (
                  <p className="mt-3 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                    {item.description}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        );
      case "process":
        return (
          <ol className="my-10 grid gap-4" key={key}>
            {block.steps.map((step, index) => (
              <li
                className="grid gap-4 border-t border-neutral-200 pt-5 dark:border-neutral-800 md:grid-cols-[64px_1fr]"
                key={step.title}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-neutral-950 text-sm font-semibold text-white dark:bg-neutral-100 dark:text-neutral-950">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-950 dark:text-neutral-50">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-neutral-600 dark:text-neutral-400">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        );
      case "result":
        return (
          <section
            className="my-10 border-l-2 border-blue-600 pl-6 dark:border-blue-400"
            key={key}
          >
            <h3 className="text-xl font-semibold text-neutral-950 dark:text-neutral-50">
              {block.title}
            </h3>
            <ul className="mt-4 grid gap-2 text-sm leading-7 text-neutral-700 dark:text-neutral-300">
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div className="grid gap-6">
      {blocks.map((block, index) => renderBlock(block, `block-${index}`))}
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
