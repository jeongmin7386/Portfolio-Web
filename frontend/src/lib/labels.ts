import type { ProjectVisibility } from './types';

export function visibilityLabel(visibility: ProjectVisibility) {
  switch (visibility) {
    case 'PUBLIC':
      return '게시됨';
    case 'DRAFT':
      return '초안';
    case 'PRIVATE':
    default:
      return '비공개';
  }
}
