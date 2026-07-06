export type PageType = 'HOME' | 'PROJECTS' | 'PROJECT_DETAIL' | 'ABOUT' | 'CONTACT' | 'COLLECTION' | 'CUSTOM';

export type BlockType =
  | 'HEADING'
  | 'SUBHEADING'
  | 'TEXT'
  | 'IMAGE'
  | 'PHOTO_GRID'
  | 'GALLERY'
  | 'SLIDER'
  | 'VIDEO_EMBED'
  | 'WIDE_EMBED'
  | 'YOUTUBE_EMBED'
  | 'FIGMA_EMBED'
  | 'DIVIDER'
  | 'QUOTE'
  | 'CALLOUT'
  | 'LIST'
  | 'CHECKLIST'
  | 'CODE'
  | 'TABLE'
  | 'SPACER'
  | 'LINK_CARD'
  | 'BUTTON'
  | 'TECH_STACK'
  | 'COLUMNS'
  | 'PROJECT_INFO'
  | 'GITHUB_LINK'
  | 'LIVE_LINK'
  | 'GITHUB_CARD'
  | 'RENDER_LINK_CARD'
  | 'NOTION_LINK_CARD'
  | 'PROJECT_CARD'
  | 'TABS'
  | 'ACCORDION'
  | 'TWO_COLUMN'
  | 'BEFORE_AFTER'
  | 'TIMELINE'
  | 'CTA'
  | 'CONTACT_FORM'
  | 'SOCIAL_ICONS'
  | 'FAQ'
  | 'STAT_CARD'
  | 'SKILL_BAR';

export type DeviceMode = 'desktop' | 'tablet' | 'mobile';

export type BlockLayoutFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
};

export type BlockLayout = Partial<Record<DeviceMode, BlockLayoutFrame>>;

export type BlockStyles = {
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  backgroundColor?: string;
  borderRadius?: number;
  padding?: number;
  margin?: number;
  opacity?: number;
  textAlign?: 'left' | 'center' | 'right';
  borderWidth?: number;
  borderColor?: string;
  borderStyle?: string;
};

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
  sectionId?: string | null;
  content: Record<string, unknown>;
  settings?: Record<string, unknown>;
  styles?: BlockStyles;
  layout?: BlockLayout;
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
  id?: number;
  blockType: BlockType;
  sectionId?: string | null;
  content?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  styles?: BlockStyles;
  layout?: BlockLayout;
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
