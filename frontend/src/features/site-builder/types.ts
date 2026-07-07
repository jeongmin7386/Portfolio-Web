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
  | 'NUMBERED_LIST'
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
  | 'VIMEO_EMBED'
  | 'PDF_EMBED'
  | 'CODEPEN_EMBED'
  | 'GOOGLE_DRIVE_EMBED'
  | 'MAP_EMBED'
  | 'AUDIO'
  | 'FULL_WIDTH_IMAGE'
  | 'IMAGE_TEXT'
  | 'PROJECT_CARD'
  | 'PROJECT_GRID'
  | 'PROJECT_OVERVIEW'
  | 'PROJECT_INFO_CARD'
  | 'PROBLEM_SOLUTION_RESULT'
  | 'ROLE_CONTRIBUTION'
  | 'RETROSPECTIVE'
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
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  backgroundColor?: string;
  borderRadius?: number;
  padding?: number;
  margin?: number;
  opacity?: number;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: number;
  border?: string;
  borderWidth?: number;
  borderColor?: string;
  borderStyle?: string;
  boxShadow?: string;
  buttonStyle?: 'solid' | 'outline' | 'ghost' | 'pill';
};

export type SectionStyles = {
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundSize?: string;
  backgroundPosition?: string;
  overlayColor?: string;
  minHeight?: number;
  padding?: number;
};

export type SiteSection = {
  id: string;
  pageId?: number | string;
  name: string;
  sortOrder: number;
  styles: SectionStyles;
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
  seoOgImage?: string;
  sections?: SiteSection[];
};

export type SiteBlock = {
  id: number;
  pageId?: number | null;
  projectId?: number | null;
  blockType: BlockType;
  name?: string;
  sectionId?: string | null;
  content: Record<string, unknown>;
  settings?: Record<string, unknown>;
  styles?: BlockStyles;
  layout?: BlockLayout;
  sortOrder: number;
  visible: boolean;
  locked?: boolean;
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
  seoOgImage?: string;
  sections?: SiteSection[];
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
  seoOgImage?: string;
  sections?: SiteSection[];
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
