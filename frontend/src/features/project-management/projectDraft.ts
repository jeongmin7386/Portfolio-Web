export type ProjectDraft = {
  title: string;
  description: string;
  caseStudy: string;
  categoryId: number | '';
  techStacks: string[];
  githubUrl: string;
  liveUrl: string;
  isPublic: boolean;
  sortOrder: number;
};

export const emptyProjectDraft: ProjectDraft = {
  title: '',
  description: '',
  caseStudy: '',
  categoryId: '',
  techStacks: [],
  githubUrl: '',
  liveUrl: '',
  isPublic: false,
  sortOrder: 0
};
