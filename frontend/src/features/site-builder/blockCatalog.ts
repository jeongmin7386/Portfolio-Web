import type { BlockLayout, BlockStyles, BlockType, DeviceMode } from './types';

export type BlockCategory = 'basic' | 'advanced';

export const blockOptions: Array<{ type: BlockType; label: string; description: string; category: BlockCategory }> = [
  { type: 'TEXT', label: '텍스트', description: '문단 텍스트를 배치합니다.', category: 'basic' },
  { type: 'HEADING', label: '제목', description: '큰 타이틀을 추가합니다.', category: 'basic' },
  { type: 'SUBHEADING', label: '소제목', description: '섹션 소제목을 추가합니다.', category: 'basic' },
  { type: 'IMAGE', label: '이미지', description: '단일 이미지를 배치합니다.', category: 'basic' },
  { type: 'PHOTO_GRID', label: '포토그리드', description: '여러 이미지를 그리드로 보여줍니다.', category: 'basic' },
  { type: 'BUTTON', label: '버튼', description: '외부 링크 버튼을 추가합니다.', category: 'basic' },
  { type: 'DIVIDER', label: '구분선', description: '콘텐츠 사이에 선을 넣습니다.', category: 'basic' },
  { type: 'QUOTE', label: '인용', description: '강조 인용문을 배치합니다.', category: 'basic' },
  { type: 'CALLOUT', label: '콜아웃', description: '중요한 메시지를 강조합니다.', category: 'basic' },
  { type: 'LIST', label: '리스트', description: '불릿 리스트를 추가합니다.', category: 'basic' },
  { type: 'CHECKLIST', label: '체크리스트', description: '체크 항목을 추가합니다.', category: 'basic' },
  { type: 'CODE', label: '코드', description: '코드 블록을 추가합니다.', category: 'basic' },
  { type: 'TABLE', label: '표', description: '간단한 표를 추가합니다.', category: 'basic' },
  { type: 'SPACER', label: '여백', description: '빈 공간을 배치합니다.', category: 'basic' },
  { type: 'TABS', label: '탭', description: '탭으로 내용을 나눕니다.', category: 'advanced' },
  { type: 'ACCORDION', label: '아코디언', description: '접히는 질문/답변을 만듭니다.', category: 'advanced' },
  { type: 'WIDE_EMBED', label: '넓은 임베드', description: '외부 페이지를 크게 임베드합니다.', category: 'advanced' },
  { type: 'YOUTUBE_EMBED', label: 'YouTube', description: '유튜브 영상을 임베드합니다.', category: 'advanced' },
  { type: 'FIGMA_EMBED', label: 'Figma', description: '피그마 프로토타입을 임베드합니다.', category: 'advanced' },
  { type: 'GITHUB_CARD', label: 'GitHub 카드', description: '저장소 링크 카드를 추가합니다.', category: 'advanced' },
  { type: 'RENDER_LINK_CARD', label: 'Render 카드', description: '배포 링크 카드를 추가합니다.', category: 'advanced' },
  { type: 'NOTION_LINK_CARD', label: 'Notion 카드', description: '노션 링크 카드를 추가합니다.', category: 'advanced' },
  { type: 'SLIDER', label: '슬라이더', description: '이미지 슬라이더를 추가합니다.', category: 'advanced' },
  { type: 'GALLERY', label: '갤러리', description: '이미지 갤러리를 추가합니다.', category: 'advanced' },
  { type: 'BEFORE_AFTER', label: 'Before/After', description: '전후 비교 이미지를 배치합니다.', category: 'advanced' },
  { type: 'TIMELINE', label: '타임라인', description: '작업 과정을 순서대로 보여줍니다.', category: 'advanced' },
  { type: 'CTA', label: 'CTA 섹션', description: '방문자 행동 유도 섹션입니다.', category: 'advanced' },
  { type: 'CONTACT_FORM', label: '문의 양식', description: '연락 폼 UI를 추가합니다.', category: 'advanced' },
  { type: 'SOCIAL_ICONS', label: '소셜 아이콘', description: '소셜 링크 묶음을 추가합니다.', category: 'advanced' },
  { type: 'FAQ', label: 'FAQ', description: '자주 묻는 질문을 추가합니다.', category: 'advanced' },
  { type: 'STAT_CARD', label: '통계 카드', description: '성과 지표 카드를 추가합니다.', category: 'advanced' },
  { type: 'SKILL_BAR', label: '스킬바', description: '진행률/숙련도를 표현합니다.', category: 'advanced' }
];

export function blockLabel(type: BlockType) {
  return blockOptions.find((option) => option.type === type)?.label ?? type;
}

export function defaultBlockContent(type: BlockType): Record<string, unknown> {
  switch (type) {
    case 'HEADING':
      return { text: 'Industrial Design', level: 1 };
    case 'SUBHEADING':
      return { text: 'Selected work and case studies', level: 2 };
    case 'IMAGE':
      return { imageUrl: '', alt: '포트폴리오 이미지', caption: '' };
    case 'PHOTO_GRID':
    case 'GALLERY':
    case 'SLIDER':
      return { images: [{ url: '', alt: '이미지 설명', caption: '캡션' }], columns: 3, gap: 16 };
    case 'DIVIDER':
      return { style: 'line' };
    case 'QUOTE':
      return { text: '좋은 포트폴리오는 결과뿐 아니라 사고 과정까지 보여줍니다.', cite: '' };
    case 'CALLOUT':
      return { icon: 'Note', title: '핵심 포인트', text: '강조하고 싶은 내용을 입력하세요.' };
    case 'BUTTON':
      return { label: 'View Project', url: '#', target: '_blank' };
    case 'LIST':
      return { items: ['첫 번째 항목', '두 번째 항목', '세 번째 항목'] };
    case 'CHECKLIST':
      return { items: [{ text: '기획', checked: true }, { text: '디자인', checked: true }, { text: '개발', checked: false }] };
    case 'CODE':
      return { language: 'tsx', code: 'const portfolio = \"editable\";' };
    case 'TABLE':
      return { rows: [['항목', '내용'], ['역할', 'Full-stack'], ['기간', '2026']] };
    case 'SPACER':
      return { height: 120 };
    case 'PROJECT_CARD':
      return { title: '새 프로젝트', category: 'Portfolio', description: '프로젝트 설명을 입력하세요.', imageUrl: '', href: '#' };
    case 'PROJECT_INFO':
      return { period: '2026.06 - 2026.07', role: '역할', contribution: '100%', category: 'Portfolio', techStacks: ['React'] };
    case 'TABS':
      return { tabs: [{ title: '기획', content: '기획 과정 설명' }, { title: '디자인', content: '디자인 과정 설명' }, { title: '개발', content: '개발 과정 설명' }] };
    case 'ACCORDION':
    case 'FAQ':
      return { items: [{ title: '질문을 입력하세요', content: '답변을 입력하세요.' }] };
    case 'TWO_COLUMN':
      return { leftTitle: '문제', leftText: '문제 설명', rightTitle: '해결', rightText: '해결 과정 설명' };
    case 'WIDE_EMBED':
    case 'YOUTUBE_EMBED':
    case 'FIGMA_EMBED':
      return { embedUrl: '', title: 'Embed' };
    case 'GITHUB_CARD':
    case 'RENDER_LINK_CARD':
    case 'NOTION_LINK_CARD':
      return { title: 'Link Card', description: '링크 설명을 입력하세요.', url: '' };
    case 'BEFORE_AFTER':
      return { beforeUrl: '', afterUrl: '', beforeLabel: 'Before', afterLabel: 'After' };
    case 'TIMELINE':
      return { items: [{ title: 'Discovery', text: '문제 정의' }, { title: 'Build', text: '해결 과정' }] };
    case 'CTA':
      return { title: '함께 만들 준비가 되셨나요?', text: '프로젝트 이야기를 들려주세요.', buttonText: 'Contact', url: '#' };
    case 'CONTACT_FORM':
      return { title: 'Contact', emailPlaceholder: 'email@example.com', messagePlaceholder: '메시지를 입력하세요.' };
    case 'SOCIAL_ICONS':
      return { links: [{ label: 'GitHub', url: '' }, { label: 'LinkedIn', url: '' }] };
    case 'STAT_CARD':
      return { value: '98%', label: '사용자 만족도', description: '측정 가능한 성과를 입력하세요.' };
    case 'SKILL_BAR':
      return { label: 'React', value: 85 };
    case 'TEXT':
    default:
      return { text: '본문을 입력하세요.' };
  }
}

export function defaultBlockStyles(type: BlockType): BlockStyles {
  const heading = type === 'HEADING';
  const subheading = type === 'SUBHEADING';
  return {
    fontSize: heading ? 64 : subheading ? 34 : 18,
    fontWeight: heading ? 900 : subheading ? 800 : 500,
    color: '#111111',
    backgroundColor: 'transparent',
    borderRadius: 8,
    padding: 0,
    margin: 0,
    opacity: 1,
    textAlign: 'left',
    borderWidth: 0,
    borderColor: '#111111',
    borderStyle: 'solid'
  };
}

export function defaultBlockLayout(type: BlockType, index: number, device: DeviceMode = 'desktop'): BlockLayout {
  const baseWidth = type === 'IMAGE' || type === 'PHOTO_GRID' || type === 'GALLERY' || type === 'SLIDER' ? 760 : 620;
  const baseHeight = type === 'HEADING' ? 160 : type === 'SPACER' ? 120 : type === 'BUTTON' ? 80 : 220;
  const x = device === 'mobile' ? 20 : device === 'tablet' ? 40 : 96;
  const y = 80 + index * 240;
  const width = device === 'mobile' ? 320 : device === 'tablet' ? Math.min(baseWidth, 560) : baseWidth;
  return {
    desktop: { x: 96, y, width: baseWidth, height: baseHeight, zIndex: index + 1 },
    tablet: { x: 40, y, width: Math.min(baseWidth, 560), height: baseHeight, zIndex: index + 1 },
    mobile: { x, y, width, height: baseHeight, zIndex: index + 1 }
  };
}
