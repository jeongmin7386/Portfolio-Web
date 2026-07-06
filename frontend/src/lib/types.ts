export type UserSummary = {
  id: number;
  email: string;
  name: string;
};

export type AuthResponse = {
  accessToken: string;
  user: UserSummary;
};

export type Profile = {
  id: number;
  slug: string;
  displayName: string;
  bio?: string;
  profileImageUrl?: string;
  theme: string;
  publicProfile: boolean;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
};

export type ProjectVisibility = 'PUBLIC' | 'PRIVATE' | 'DRAFT';

export type Project = {
  id: number;
  title: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
  techStacks: string[];
  githubUrl?: string;
  liveUrl?: string;
  visibility: ProjectVisibility;
  sortOrder: number;
  category?: {
    id: number;
    name: string;
    slug: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type ProjectPayload = {
  title: string;
  description?: string;
  categoryId?: number | null;
  techStacks: string[];
  githubUrl?: string;
  liveUrl?: string;
  visibility: ProjectVisibility;
  sortOrder?: number;
};

export type PublicPortfolio = {
  profile: {
    slug: string;
    displayName: string;
    bio?: string;
    profileImageUrl?: string;
    theme: string;
  };
  categories: Array<Pick<Category, 'id' | 'name' | 'slug'>>;
  projects: Array<{
    id: number;
    title: string;
    slug: string;
    description?: string;
    thumbnailUrl?: string;
    techStacks: string[];
    githubUrl?: string;
    liveUrl?: string;
    category?: Pick<Category, 'id' | 'name' | 'slug'> | null;
  }>;
};
