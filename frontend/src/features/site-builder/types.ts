export type PageType = 'HOME' | 'PROJECTS' | 'PROJECT_DETAIL' | 'ABOUT' | 'CONTACT' | 'COLLECTION' | 'CUSTOM';

export type BlockType =
  | 'HEADING'
  | 'TEXT'
  | 'IMAGE'
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
  | 'PROJECT_CARD';

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
  pageId: number;
  blockType: BlockType;
  content: Record<string, unknown>;
  sortOrder: number;
};

export type PageWithBlocks = {
  page: SitePage;
  blocks: SiteBlock[];
};

export type BuilderState = {
  site: SiteResponse;
  pages: SitePage[];
};

export type SiteRender = {
  site: SiteResponse;
  pages: PageWithBlocks[];
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
  sortOrder?: number;
};
