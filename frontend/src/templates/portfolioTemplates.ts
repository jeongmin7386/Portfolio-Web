export type PortfolioTemplate = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  accent: string;
  background: string;
  layout: string;
  imageUrl: string;
  sections: string[];
};

export const portfolioTemplates: PortfolioTemplate[] = [
  {
    id: 'MINIMAL_PORTFOLIO',
    name: 'Minimal Portfolio',
    tagline: '작업에 집중시키는 미니멀 그리드',
    description: '큰 이미지, 절제된 타이포그래피, 조용한 내비게이션으로 정돈된 포트폴리오를 만듭니다.',
    accent: '#111111',
    background: '#f6f3ed',
    layout: '그리드',
    imageUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
    sections: ['히어로', '대표 작업', '소개', '연락']
  },
  {
    id: 'DEVELOPER_PORTFOLIO',
    name: 'Developer Portfolio',
    tagline: '제품, 코드, 라이브 데모를 함께 보여주기',
    description: '기술 프로젝트, 링크, 사용 스택, 케이스 스터디를 빠르게 정리할 수 있는 개발자용 레이아웃입니다.',
    accent: '#0a84ff',
    background: '#f7f8f4',
    layout: '분할 히어로',
    imageUrl: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80',
    sections: ['소개', '프로젝트 갤러리', '기술 스택', '링크']
  },
  {
    id: 'DESIGNER_PORTFOLIO',
    name: 'Designer Portfolio',
    tagline: '시각적으로 강한 프로젝트 스토리텔링',
    description: '몰입감 있는 프로젝트 커버, 간결한 크레딧, 정돈된 케이스 스터디 흐름을 제공합니다.',
    accent: '#ff5a3d',
    background: '#fff8f2',
    layout: '매거진',
    imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    sections: ['커버', '케이스 스터디', '서비스', '연락']
  },
  {
    id: 'PHOTOGRAPHY_GRID',
    name: 'Photography Grid',
    tagline: '이미지가 먼저 보이는 갤러리 월',
    description: '사진, 비주얼 아트, 이미지 중심 작업을 촘촘한 갤러리처럼 보여주는 레이아웃입니다.',
    accent: '#16856f',
    background: '#f4f2ec',
    layout: '메이슨리',
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
    sections: ['갤러리', '시리즈', '저널', '연락']
  },
  {
    id: 'CASE_STUDY_LAYOUT',
    name: 'Case Study Layout',
    tagline: '프로젝트 과정을 길게 설명하는 구성',
    description: '문제, 과정, 결과, 기술 스택, 외부 링크를 구조적으로 보여주는 케이스 스터디 레이아웃입니다.',
    accent: '#c48a2c',
    background: '#fbfaf6',
    layout: '스토리',
    imageUrl: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80',
    sections: ['문제', '과정', '결과', '크레딧']
  }
];

export function findPortfolioTemplate(templateId?: string) {
  if (templateId === 'MINIMAL_GRID') {
    return portfolioTemplates[0];
  }
  return portfolioTemplates.find((template) => template.id === templateId) ?? portfolioTemplates[0];
}
