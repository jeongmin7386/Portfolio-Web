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
  category: ProjectCategory;
  tags: string[];
  coverImage: string;
  description: string;
  tools: string[];
  deliverables: string[];
  blocks: ProjectBlock[];
  featured?: boolean;
};

export type Note = {
  slug: string;
  title: string;
  date: string;
  category: string;
  tags: string[];
  excerpt: string;
};
