export const PROJECT_CATEGORIES = [
  "브랜딩",
  "UI/UX",
  "에디토리얼",
  "모션",
  "아트 디렉션"
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export type ProjectImage = {
  src: string;
  alt: string;
  caption?: string;
};

export type ProjectBlock =
  | {
      type: "heading";
      text: string;
      level?: 2 | 3;
    }
  | {
      type: "paragraph";
      text: string;
    }
  | {
      type: "image";
      src: string;
      alt: string;
      caption?: string;
      aspectRatio?: "wide" | "square" | "portrait";
    }
  | {
      type: "imageGrid";
      images: ProjectImage[];
      columns?: 2 | 3;
    }
  | {
      type: "quote";
      quote: string;
      cite?: string;
    }
  | {
      type: "twoColumn";
      left: ProjectBlock[];
      right: ProjectBlock[];
    }
  | {
      type: "stats";
      items: Array<{
        label: string;
        value: string;
        description?: string;
      }>;
    }
  | {
      type: "process";
      steps: Array<{
        title: string;
        description: string;
      }>;
    }
  | {
      type: "result";
      title: string;
      items: string[];
    };

export type Project = {
  slug: string;
  title: string;
  subtitle: string;
  year: string;
  period: string;
  role: string;
  client: string;
  category: string;
  tags: string[];
  coverImage: string;
  description: string;
  tools: string[];
  deliverables: string[];
  blocks: ProjectBlock[];
  featured?: boolean;
  link?: string;
};

export type Note = {
  slug: string;
  title: string;
  date: string;
  category: string;
  tags: string[];
  excerpt: string;
};

export type StudioArchiveContent = {
  categories: string[];
  projects: Project[];
  notes: Note[];
  updatedAt: string;
};

export const BUILDER_SECTION_TYPES = [
  "hero",
  "projectGrid",
  "imageGallery",
  "textSection",
  "twoColumn",
  "quote",
  "button",
  "divider",
  "embed",
  "contact",
  "archiveList"
] as const;

export const BUILDER_BLOCK_TYPES = [
  "heading",
  "paragraph",
  "image",
  "gallery",
  "button",
  "divider",
  "embed",
  "spacer",
  "quote",
  "stats"
] as const;

export type BuilderSectionType = (typeof BUILDER_SECTION_TYPES)[number];
export type BuilderBlockType = (typeof BUILDER_BLOCK_TYPES)[number];
export type BuilderPageStatus = "draft" | "published";
export type BuilderAlign = "left" | "center" | "right";
export type BuilderViewport = "desktop" | "tablet" | "mobile";
export type BuilderTextFont = "sans" | "display" | "serif" | "mono";
export type BuilderTextSize =
  | "xs"
  | "sm"
  | "base"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "5xl"
  | "6xl"
  | "7xl";

export type BuilderTextSettings = {
  fontFamily?: BuilderTextFont;
  fontSize?: BuilderTextSize;
};

export type BuilderSectionSettings = {
  paddingY?: "none" | "sm" | "md" | "lg" | "xl";
  marginY?: "none" | "sm" | "md" | "lg";
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundImagePosition?: "center" | "top" | "bottom" | "left" | "right";
  backgroundImageSize?: "cover" | "contain";
  backgroundOverlay?: "none" | "dark" | "light";
  textColor?: string;
  maxWidth?: "narrow" | "content" | "wide" | "full";
  align?: BuilderAlign;
  columns?: 1 | 2 | 3 | 4;
  gap?: "none" | "sm" | "md" | "lg";
  imageRatio?: "wide" | "square" | "portrait";
  borderRadius?: "none" | "sm" | "md" | "lg";
  cardStyle?: "none" | "border" | "filled";
  gridStyle?: "cards" | "grid" | "list" | "masonry";
  projectSource?: "featured" | "all";
  projectLimit?: number;
  category?: string;
};

export type BuilderBlock =
  | {
      id: string;
      type: "heading";
      order: number;
      content: {
        text: string;
      };
      settings: {
        level?: 1 | 2 | 3;
        align?: BuilderAlign;
      } & BuilderTextSettings;
    }
  | {
      id: string;
      type: "paragraph";
      order: number;
      content: {
        text: string;
      };
      settings: {
        width?: "narrow" | "content" | "wide";
        align?: BuilderAlign;
      } & BuilderTextSettings;
    }
  | {
      id: string;
      type: "image";
      order: number;
      content: {
        src: string;
        alt: string;
        caption?: string;
      };
      settings: {
        ratio?: "wide" | "square" | "portrait";
        borderRadius?: "none" | "sm" | "md" | "lg";
      };
    }
  | {
      id: string;
      type: "gallery";
      order: number;
      content: {
        images: ProjectImage[];
      };
      settings: {
        columns?: 2 | 3 | 4;
        gap?: "sm" | "md" | "lg";
      };
    }
  | {
      id: string;
      type: "button";
      order: number;
      content: {
        label: string;
        href: string;
      };
      settings: {
        variant?: "primary" | "secondary" | "text";
        align?: BuilderAlign;
      } & BuilderTextSettings;
    }
  | {
      id: string;
      type: "divider";
      order: number;
      content: Record<string, never>;
      settings: {
        spacing?: "sm" | "md" | "lg";
        style?: "line" | "dashed" | "blank";
      };
    }
  | {
      id: string;
      type: "embed";
      order: number;
      content: {
        url: string;
        provider?: string;
      };
      settings: {
        ratio?: "wide" | "square";
      };
    }
  | {
      id: string;
      type: "spacer";
      order: number;
      content: Record<string, never>;
      settings: {
        height?: number;
      };
    }
  | {
      id: string;
      type: "quote";
      order: number;
      content: {
        text: string;
        author?: string;
      };
      settings: {
        align?: BuilderAlign;
      } & BuilderTextSettings;
    }
  | {
      id: string;
      type: "stats";
      order: number;
      content: {
        label: string;
        value: string;
      };
      settings: {
        align?: BuilderAlign;
      } & BuilderTextSettings;
    };

export type BuilderSection = {
  id: string;
  type: BuilderSectionType;
  order: number;
  settings: BuilderSectionSettings;
  blocks: BuilderBlock[];
};

export type BuilderPage = {
  id: string;
  slug: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
  status: BuilderPageStatus;
  sections: BuilderSection[];
  publishedSections?: BuilderSection[];
  publishedSeoTitle?: string;
  publishedSeoDescription?: string;
  publishedAt?: string;
  updatedAt: string;
};
