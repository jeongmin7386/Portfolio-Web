import type { BlockType } from './types';

export const blockOptions: Array<{ type: BlockType; label: string; description: string }> = [
  { type: 'HEADING', label: '제목', description: '섹션의 큰 제목을 추가합니다.' },
  { type: 'TEXT', label: '본문', description: '설명이나 소개 문장을 작성합니다.' },
  { type: 'IMAGE', label: '이미지', description: '대표 이미지와 캡션을 배치합니다.' },
  { type: 'DIVIDER', label: '구분선', description: '콘텐츠 사이에 여백과 선을 만듭니다.' },
  { type: 'QUOTE', label: '인용', description: '강조 문장이나 추천사를 넣습니다.' },
  { type: 'CALLOUT', label: '콜아웃', description: '중요한 안내나 핵심 메시지를 강조합니다.' },
  { type: 'BUTTON', label: '버튼', description: '외부 링크나 연락 버튼을 추가합니다.' },
  { type: 'PROJECT_CARD', label: '프로젝트 카드', description: '이미지 중심 프로젝트 카드를 추가합니다.' }
];

export function blockLabel(type: BlockType) {
  return blockOptions.find((option) => option.type === type)?.label ?? type;
}

export function defaultBlockContent(type: BlockType): Record<string, unknown> {
  switch (type) {
    case 'HEADING':
      return { text: '새 섹션 제목', level: 2 };
    case 'IMAGE':
      return { imageUrl: '', alt: '포트폴리오 이미지', caption: '' };
    case 'DIVIDER':
      return { style: 'line' };
    case 'QUOTE':
      return { text: '인용문을 입력하세요.', cite: '' };
    case 'CALLOUT':
      return { tone: 'neutral', text: '강조하고 싶은 내용을 입력하세요.' };
    case 'BUTTON':
      return { label: '버튼', href: '#' };
    case 'PROJECT_CARD':
      return { title: '새 프로젝트', description: '프로젝트 설명을 입력하세요.', imageUrl: '', href: '#' };
    case 'TEXT':
    default:
      return { text: '본문을 입력하세요.' };
  }
}
