"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useEffect } from "react";

export type LightboxImage = {
  src: string;
  alt: string;
  caption?: string;
};

type ImageLightboxProps = {
  images: LightboxImage[];
  activeIndex: number | null;
  onClose: () => void;
  onSelect: (index: number) => void;
};

export function ImageLightbox({
  images,
  activeIndex,
  onClose,
  onSelect
}: ImageLightboxProps) {
  const activeImage =
    activeIndex === null || !images[activeIndex] ? null : images[activeIndex];
  const hasMultipleImages = images.length > 1;

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }

    const currentIndex = activeIndex;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }

      if (event.key === "ArrowLeft" && hasMultipleImages) {
        onSelect(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
      }

      if (event.key === "ArrowRight" && hasMultipleImages) {
        onSelect(currentIndex === images.length - 1 ? 0 : currentIndex + 1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, hasMultipleImages, images.length, onClose, onSelect]);

  if (!activeImage || activeIndex === null) {
    return null;
  }

  const goToPrevious = () => {
    onSelect(activeIndex === 0 ? images.length - 1 : activeIndex - 1);
  };

  const goToNext = () => {
    onSelect(activeIndex === images.length - 1 ? 0 : activeIndex + 1);
  };

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/90 px-4 py-6"
      onClick={onClose}
      role="dialog"
    >
      <button
        aria-label="이미지 닫기"
        className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-md bg-white text-neutral-950 transition hover:bg-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        onClick={onClose}
        title="이미지 닫기"
        type="button"
      >
        <X aria-hidden size={20} />
      </button>
      <div
        className="grid max-h-full w-full max-w-6xl gap-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative flex min-h-[45vh] items-center justify-center">
          {hasMultipleImages ? (
            <button
              aria-label="이전 이미지"
              className="absolute left-0 z-10 inline-flex h-11 w-11 items-center justify-center rounded-md bg-white/90 text-neutral-950 transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              onClick={goToPrevious}
              title="이전 이미지"
              type="button"
            >
              <ChevronLeft aria-hidden size={22} />
            </button>
          ) : null}
          <Image
            alt={activeImage.alt}
            className="max-h-[78vh] w-auto max-w-full rounded-md object-contain"
            height={900}
            sizes="100vw"
            src={activeImage.src}
            unoptimized
            width={1600}
          />
          {hasMultipleImages ? (
            <button
              aria-label="다음 이미지"
              className="absolute right-0 z-10 inline-flex h-11 w-11 items-center justify-center rounded-md bg-white/90 text-neutral-950 transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              onClick={goToNext}
              title="다음 이미지"
              type="button"
            >
              <ChevronRight aria-hidden size={22} />
            </button>
          ) : null}
        </div>
        {activeImage.caption ? (
          <p className="mx-auto max-w-2xl text-center text-sm text-neutral-300">
            {activeImage.caption}
          </p>
        ) : null}
      </div>
    </div>
  );
}
