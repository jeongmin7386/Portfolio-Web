export type PageType = 'HOME' | 'PROJECTS' | 'PROJECT_DETAIL' | 'ABOUT' | 'CONTACT' | 'COLLECTION' | 'CUSTOM';

export type BlockType =
  | 'HEADING'
  | 'TEXT'
  | 'IMAGE'
  | 'PHOTO_GRID'
  | 'GALLERY'
  | 'VIDEO_EMBED'
  | 'DIVIDER'
  | 'QUOTE'
  | 'CALLOUT'
  | 'CODE'
  | 'LINK_CARD'
  | 'BUTTON'
  | 'TECH_STACK'
  | 'COLUMNS'
  | 'PROJECT_INFO'
  | 'GITHUB_LINK'
  | 'LIVE_LINK'
  | 'PROJECT_CARD'
  | 'TABS'
  | 'TWO_COLUMN';

export type BuilderProjectVisibility = 'PUBLIC' | 'PRIVATE' | 'DRAFT';

export type ThemeResponse = {
  id: number;
  name: string;
  settings: Record<string, unknown>;
};

export type SiteResponse = {
  id: number;
  slug: string;
  title: string;
  description?: string;
  profileImageUrl?: string;
  published: boolean;
  theme?: ThemeResponse | null;
};

export type SitePage = {
  id: number;
  siteId: number;
  title: string;
  slug: string;
  pageType: PageType;
  publicPage: boolean;
  navVisible: boolean;
  sortOrder: number;
  seoTitle?: string;
  seoDescription?: string;
};

export type SiteBlock = {
  id: number;
  pageId?: number | null;
  projectId?: number | null;
  blockType: BlockType;
  content: Record<string, unknown>;
  settings?: Record<string, unknown>;
  sortOrder: number;
  visible: boolean;
};

export type BuilderProject = {
  id: number;
  siteId: number;
  title: string;
  slug: string;
  subtitle?: string;
  summary?: string;
  description?: string;
  period?: string;
  role?: string;
  contribution?: string;
  category?: string;
  thumbnailUrl?: string;
  techStacks: string[];
  githubUrl?: string;
  liveUrl?: string;
  visibility: BuilderProjectVisibility;
  sortOrder: number;
  seoTitle?: string;
  seoDescription?: string;
};

export type PageWithBlocks = {
  page: SitePage;
  blocks: SiteBlock[];
};

export type ProjectWithBlocks = {
  project: BuilderProject;
  blocks: SiteBlock[];
};

export type BuilderState = {
  site: SiteResponse;
  pages: SitePage[];
  projects: BuilderProject[];
};

export type SiteRender = {
  site: SiteResponse;
  pages: PageWithBlocks[];
  projects: BuilderProject[];
};

export type PagePayload = {
  title: string;
  slug?: string;
  pageType?: PageType;
  publicPage?: boolean;
  navVisible?: boolean;
  sortOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
};

export type BlockPayload = {
  blockType: BlockType;
  content?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  visible?: boolean;
  sortOrder?: number;
};

export type BuilderProjectPayload = {
  title: string;
  slug?: string;
  subtitle?: string;
  summary?: string;
  description?: string;
  period?: string;
  role?: string;
  contribution?: string;
  category?: string;
  thumbnailUrl?: string;
  techStacks?: string[];
  githubUrl?: string;
  liveUrl?: string;
  visibility?: BuilderProjectVisibility;
  sortOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
};
