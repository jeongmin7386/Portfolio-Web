import type { BlockLayout, BlockStyles, BlockType, DeviceMode, SectionStyles, SiteSection } from './types';

export type BlockCategory = 'basic' | 'media' | 'portfolio' | 'advanced';

export const blockOptions: Array<{ type: BlockType; label: string; description: string; category: BlockCategory }> = [
  { type: 'TEXT', label: '텍스트', description: '문단 텍스트를 배치합니다.', category: 'basic' },
  { type: 'HEADING', label: '제목', description: '큰 타이틀을 추가합니다.', category: 'basic' },
  { type: 'SUBHEADING', label: '소제목', description: '섹션 소제목을 추가합니다.', category: 'basic' },
  { type: 'IMAGE', label: '이미지', description: '단일 이미지를 배치합니다.', category: 'basic' },
  { type: 'DIVIDER', label: '구분선', description: '콘텐츠 사이에 선을 넣습니다.', category: 'basic' },
  { type: 'BUTTON', label: '버튼', description: '외부 링크 버튼을 추가합니다.', category: 'basic' },
  { type: 'QUOTE', label: '인용', description: '강조 인용문을 배치합니다.', category: 'basic' },
  { type: 'CALLOUT', label: '콜아웃', description: '중요한 메시지를 강조합니다.', category: 'basic' },
  { type: 'LIST', label: '리스트', description: '불릿 리스트를 추가합니다.', category: 'basic' },
  { type: 'NUMBERED_LIST', label: '번호 리스트', description: '순서가 있는 리스트를 추가합니다.', category: 'basic' },
  { type: 'CHECKLIST', label: '체크리스트', description: '체크 항목을 추가합니다.', category: 'basic' },
  { type: 'CODE', label: '코드', description: '코드 블록을 추가합니다.', category: 'basic' },
  { type: 'TABLE', label: '표', description: '간단한 표를 추가합니다.', category: 'basic' },
  { type: 'SPACER', label: '여백', description: '빈 공간을 배치합니다.', category: 'basic' },

  { type: 'PHOTO_GRID', label: '포토그리드', description: '여러 이미지를 그리드로 보여줍니다.', category: 'media' },
  { type: 'GALLERY', label: '갤러리', description: '이미지 갤러리를 추가합니다.', category: 'media' },
  { type: 'SLIDER', label: '슬라이더', description: '이미지 슬라이더를 추가합니다.', category: 'media' },
  { type: 'VIDEO_EMBED', label: '비디오', description: '외부 영상을 임베드합니다.', category: 'media' },
  { type: 'AUDIO', label: '오디오', description: '오디오 플레이어를 추가합니다.', category: 'media' },
  { type: 'FULL_WIDTH_IMAGE', label: '전체 폭 이미지', description: '넓은 이미지 섹션을 만듭니다.', category: 'media' },
  { type: 'IMAGE_TEXT', label: '이미지 + 텍스트', description: '이미지와 설명을 나란히 배치합니다.', category: 'media' },
  { type: 'BEFORE_AFTER', label: 'Before/After', description: '전후 비교 이미지를 배치합니다.', category: 'media' },

  { type: 'PROJECT_OVERVIEW', label: '프로젝트 개요', description: '프로젝트 핵심 정보를 요약합니다.', category: 'portfolio' },
  { type: 'PROJECT_INFO', label: '프로젝트 정보', description: '기간, 역할, 기술을 표시합니다.', category: 'portfolio' },
  { type: 'PROJECT_INFO_CARD', label: '정보 카드', description: '프로젝트 메타 정보를 카드로 표시합니다.', category: 'portfolio' },
  { type: 'TECH_STACK', label: '기술 스택', description: '기술 태그를 추가합니다.', category: 'portfolio' },
  { type: 'GITHUB_LINK', label: 'GitHub 버튼', description: 'GitHub 링크 버튼을 추가합니다.', category: 'portfolio' },
  { type: 'LIVE_LINK', label: '배포 링크 버튼', description: '배포 사이트 버튼을 추가합니다.', category: 'portfolio' },
  { type: 'PROBLEM_SOLUTION_RESULT', label: '문제/해결/결과', description: '케이스 스터디 구조를 추가합니다.', category: 'portfolio' },
  { type: 'TIMELINE', label: '타임라인', description: '작업 과정을 순서대로 보여줍니다.', category: 'portfolio' },
  { type: 'ROLE_CONTRIBUTION', label: '역할/기여도', description: '역할과 기여도를 정리합니다.', category: 'portfolio' },
  { type: 'STAT_CARD', label: '성과 지표', description: '성과 지표 카드를 추가합니다.', category: 'portfolio' },
  { type: 'RETROSPECTIVE', label: '회고', description: '배운 점과 다음 개선점을 작성합니다.', category: 'portfolio' },
  { type: 'PROJECT_CARD', label: '대표 프로젝트 카드', description: '단일 프로젝트 카드를 추가합니다.', category: 'portfolio' },
  { type: 'PROJECT_GRID', label: '프로젝트 카드 그리드', description: '여러 프로젝트 카드를 배치합니다.', category: 'portfolio' },

  { type: 'TABS', label: '탭', description: '탭으로 내용을 나눕니다.', category: 'advanced' },
  { type: 'ACCORDION', label: '아코디언', description: '접히는 질문/답변을 만듭니다.', category: 'advanced' },
  { type: 'WIDE_EMBED', label: '넓은 임베드', description: '외부 페이지를 크게 임베드합니다.', category: 'advanced' },
  { type: 'YOUTUBE_EMBED', label: 'YouTube', description: '유튜브 영상을 임베드합니다.', category: 'advanced' },
  { type: 'VIMEO_EMBED', label: 'Vimeo', description: 'Vimeo 영상을 임베드합니다.', category: 'advanced' },
  { type: 'FIGMA_EMBED', label: 'Figma', description: '피그마 프로토타입을 임베드합니다.', category: 'advanced' },
  { type: 'GITHUB_CARD', label: 'GitHub Repository', description: '저장소 링크 카드를 추가합니다.', category: 'advanced' },
  { type: 'NOTION_LINK_CARD', label: 'Notion 카드', description: '노션 링크 카드를 추가합니다.', category: 'advanced' },
  { type: 'PDF_EMBED', label: 'PDF', description: 'PDF 문서를 임베드합니다.', category: 'advanced' },
  { type: 'CODEPEN_EMBED', label: 'CodePen', description: 'CodePen 결과물을 임베드합니다.', category: 'advanced' },
  { type: 'GOOGLE_DRIVE_EMBED', label: 'Google Drive', description: 'Drive 문서를 임베드합니다.', category: 'advanced' },
  { type: 'MAP_EMBED', label: '지도', description: '지도 임베드를 추가합니다.', category: 'advanced' },
  { type: 'LINK_CARD', label: '링크 카드', description: '외부 링크 카드를 추가합니다.', category: 'advanced' },
  { type: 'RENDER_LINK_CARD', label: 'Render 카드', description: '배포 링크 카드를 추가합니다.', category: 'advanced' },
  { type: 'CTA', label: 'CTA 섹션', description: '방문자 행동 유도 섹션입니다.', category: 'advanced' },
  { type: 'CONTACT_FORM', label: '문의 양식', description: '연락 폼 UI를 추가합니다.', category: 'advanced' },
  { type: 'SOCIAL_ICONS', label: '소셜 아이콘', description: '소셜 링크 묶음을 추가합니다.', category: 'advanced' },
  { type: 'FAQ', label: 'FAQ', description: '자주 묻는 질문을 추가합니다.', category: 'advanced' },
  { type: 'SKILL_BAR', label: '스킬바', description: '진행률/숙련도를 표현합니다.', category: 'advanced' }
];

export function blockLabel(type: BlockType) {
  return blockOptions.find((option) => option.type === type)?.label ?? type;
}

export function defaultBlockContent(type: BlockType): Record<string, unknown> {
  switch (type) {
    case 'HEADING':
      return { text: '', level: 1 };
    case 'SUBHEADING':
      return { text: '', level: 2 };
    case 'IMAGE':
    case 'FULL_WIDTH_IMAGE':
      return { imageUrl: '', alt: '', caption: '' };
    case 'PHOTO_GRID':
    case 'GALLERY':
    case 'SLIDER':
      return { images: [{ url: '', alt: '', caption: '' }], columns: 3, gap: 16 };
    case 'DIVIDER':
      return { style: 'line' };
    case 'QUOTE':
      return { text: '', cite: '' };
    case 'CALLOUT':
      return { icon: '', title: '', text: '' };
    case 'BUTTON':
    case 'GITHUB_LINK':
    case 'LIVE_LINK':
      return { label: '', url: '', target: '_blank' };
    case 'LIST':
    case 'NUMBERED_LIST':
      return { items: [''] };
    case 'CHECKLIST':
      return { items: [{ text: '', checked: false }] };
    case 'CODE':
      return { language: '', code: '' };
    case 'TABLE':
      return { rows: [['', '']] };
    case 'SPACER':
      return { height: 120 };
    case 'PROJECT_CARD':
      return { title: '', category: '', description: '', imageUrl: '', href: '' };
    case 'PROJECT_GRID':
      return { items: [{ title: '', category: '', description: '', imageUrl: '', href: '' }], columns: 3 };
    case 'PROJECT_OVERVIEW':
      return { title: '', subtitle: '', description: '' };
    case 'PROJECT_INFO':
    case 'PROJECT_INFO_CARD':
      return { period: '', role: '', contribution: '', category: '', techStacks: [] };
    case 'PROBLEM_SOLUTION_RESULT':
      return { problemTitle: '', problemText: '', solutionTitle: '', solutionText: '', resultTitle: '', resultText: '' };
    case 'ROLE_CONTRIBUTION':
      return { role: '', contribution: '', text: '' };
    case 'RETROSPECTIVE':
      return { title: '', text: '' };
    case 'TECH_STACK':
      return { items: [] };
    case 'TABS':
      return { tabs: [{ title: '', content: '' }] };
    case 'ACCORDION':
    case 'FAQ':
      return { items: [{ title: '', content: '' }] };
    case 'TWO_COLUMN':
    case 'COLUMNS':
    case 'IMAGE_TEXT':
      return { leftTitle: '', leftText: '', rightTitle: '', rightText: '', imageUrl: '', alt: '' };
    case 'WIDE_EMBED':
      return { title: '', embedUrl: '', embedProvider: 'iframe', wide: true };
    case 'VIDEO_EMBED':
    case 'YOUTUBE_EMBED':
      return { title: '', embedUrl: '', embedProvider: 'youtube', wide: false };
    case 'VIMEO_EMBED':
      return { title: '', embedUrl: '', embedProvider: 'vimeo', wide: false };
    case 'FIGMA_EMBED':
      return { title: '', embedUrl: '', embedProvider: 'figma', wide: false };
    case 'PDF_EMBED':
      return { title: '', embedUrl: '', embedProvider: 'pdf', wide: false };
    case 'CODEPEN_EMBED':
      return { title: '', embedUrl: '', embedProvider: 'codepen', wide: false };
    case 'GOOGLE_DRIVE_EMBED':
      return { title: '', embedUrl: '', embedProvider: 'googleDrive', wide: false };
    case 'MAP_EMBED':
      return { title: '', embedUrl: '', embedProvider: 'map', wide: false };
    case 'GITHUB_CARD':
      return { title: '', description: '', url: '', embedProvider: 'github' };
    case 'LINK_CARD':
    case 'RENDER_LINK_CARD':
    case 'NOTION_LINK_CARD':
      return { title: '', description: '', url: '' };
    case 'BEFORE_AFTER':
      return { beforeUrl: '', afterUrl: '', beforeLabel: '', afterLabel: '' };
    case 'TIMELINE':
      return { items: [{ title: '', text: '' }] };
    case 'CTA':
      return { title: '', text: '', buttonText: '', url: '' };
    case 'CONTACT_FORM':
      return { title: '', emailPlaceholder: '', messagePlaceholder: '' };
    case 'SOCIAL_ICONS':
      return { links: [{ label: '', url: '' }] };
    case 'STAT_CARD':
      return { value: '', label: '', description: '' };
    case 'SKILL_BAR':
      return { label: '', value: 0 };
    case 'AUDIO':
      return { title: '', audioUrl: '' };
    case 'TEXT':
    default:
      return { text: '' };
  }
}

export function defaultBlockStyles(type: BlockType): BlockStyles {
  const heading = type === 'HEADING';
  const subheading = type === 'SUBHEADING';
  return {
    fontFamily: 'Pretendard',
    fontSize: heading ? 64 : subheading ? 34 : 18,
    fontWeight: heading ? 900 : subheading ? 800 : 500,
    color: '#111111',
    backgroundColor: 'transparent',
    borderRadius: 8,
    padding: 0,
    margin: 0,
    opacity: 1,
    textAlign: 'left',
    lineHeight: heading ? 1.05 : 1.6,
    border: 'none',
    borderWidth: 0,
    borderColor: '#111111',
    borderStyle: 'solid',
    boxShadow: 'none',
    buttonStyle: 'solid'
  };
}

export function defaultBlockLayout(type: BlockType, index: number, device: DeviceMode = 'desktop'): BlockLayout {
  const wideTypes: BlockType[] = ['IMAGE', 'FULL_WIDTH_IMAGE', 'PHOTO_GRID', 'GALLERY', 'SLIDER', 'WIDE_EMBED', 'FIGMA_EMBED', 'YOUTUBE_EMBED'];
  const compactTypes: BlockType[] = ['BUTTON', 'DIVIDER', 'SPACER', 'GITHUB_LINK', 'LIVE_LINK'];
  const baseWidth = wideTypes.includes(type) ? 900 : 620;
  const baseHeight = type === 'HEADING' ? 160 : compactTypes.includes(type) ? 90 : type === 'SPACER' ? 120 : 240;
  const y = 80 + index * 260;
  return {
    desktop: { x: 96, y, width: baseWidth, height: baseHeight, zIndex: index + 1 },
    tablet: { x: 40, y, width: Math.min(baseWidth, 600), height: baseHeight, zIndex: index + 1 },
    mobile: { x: 20, y, width: 320, height: baseHeight, zIndex: index + 1 }
  };
}

export function defaultSectionStyles(): SectionStyles {
  return {
    backgroundColor: '#fffdf9',
    backgroundImage: '',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    overlayColor: 'rgba(0,0,0,0)',
    minHeight: 720,
    padding: 80
  };
}

export function defaultSection(id = 'section-main', name = 'Main Section', sortOrder = 0): SiteSection {
  return {
    id,
    name,
    sortOrder,
    styles: defaultSectionStyles()
  };
}
