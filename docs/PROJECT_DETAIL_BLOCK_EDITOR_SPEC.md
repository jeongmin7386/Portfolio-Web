# Project Detail Block Editor Specification

## Product Direction

이 플랫폼은 포트폴리오 사이트와 프로젝트 상세 페이지를 사용자가 직접 설계하고 게시하는 웹 빌더다.
특정 브랜드의 시각 디자인, 로고, 컬러, 레이아웃을 복제하지 않고, 다음 기능 구조만 참고한다.

- 이미지 중심 포트폴리오 공개 페이지
- 프로젝트 목록과 프로젝트 상세 페이지
- 프로젝트 상세 페이지 안의 모든 문구와 섹션 직접 편집
- Notion처럼 블록 단위로 빠르게 추가, 수정, 삭제, 정렬
- Render 배포에 맞는 React + Spring Boot + PostgreSQL 구조

## MVP Scope

MVP에서 구현할 블록:

- 텍스트 블록
- 제목 블록
- 이미지 블록
- 포토그리드 블록
- 버튼 블록
- 구분선 블록
- 인용 블록
- 콜아웃 블록
- 탭 블록
- 2단 레이아웃 블록

MVP에서 프로젝트 상세 페이지에서 편집 가능한 항목:

- 프로젝트 제목, 부제목, 설명
- 프로젝트 기간, 역할, 기여도
- 사용 기술
- 문제 정의, 해결 과정, 결과/성과, 회고
- 섹션 제목과 본문
- 버튼 문구와 링크 URL
- 이미지 alt, 설명, 캡션

후속 확장 블록:

- 갤러리, 슬라이더, 아코디언, 코드, 표
- GitHub Repository 카드, Figma 임베드, Render 배포 카드
- CTA, FAQ, 통계 카드, 진행률/스킬 바

## Frontend Structure

```txt
frontend/src
  app/
    router.tsx
    queryClient.ts

  components/
    layout/
      AppShell.tsx
      BuilderTopbar.tsx
      BuilderSidebar.tsx
      InspectorPanel.tsx
    ui/
      Button.tsx
      Input.tsx
      Textarea.tsx
      Toggle.tsx
      Select.tsx
      Modal.tsx
      Tabs.tsx

  features/
    sites/
      siteApi.ts
      siteTypes.ts

    pages/
      pageApi.ts
      PageListPanel.tsx
      PageSettingsPanel.tsx

    projects/
      projectApi.ts
      projectTypes.ts
      ProjectListPanel.tsx
      ProjectMetaForm.tsx

    blocks/
      blockApi.ts
      blockTypes.ts
      blockCatalog.ts
      defaultBlockContent.ts
      defaultBlockSettings.ts
      components/
        BlockAddModal.tsx
        BlockEditorCanvas.tsx
        BlockEditorFrame.tsx
        BlockInspector.tsx
        SortableBlockList.tsx
      editors/
        TextBlockEditor.tsx
        HeadingBlockEditor.tsx
        ImageBlockEditor.tsx
        PhotoGridBlockEditor.tsx
        ButtonBlockEditor.tsx
        DividerBlockEditor.tsx
        QuoteBlockEditor.tsx
        CalloutBlockEditor.tsx
        TabsBlockEditor.tsx
        TwoColumnBlockEditor.tsx
      renderers/
        BlockRenderer.tsx
        TextBlock.tsx
        HeadingBlock.tsx
        ImageBlock.tsx
        PhotoGridBlock.tsx
        ButtonBlock.tsx
        DividerBlock.tsx
        QuoteBlock.tsx
        CalloutBlock.tsx
        TabsBlock.tsx
        TwoColumnBlock.tsx

    media/
      mediaApi.ts
      MediaLibrary.tsx
      ImageUploader.tsx

    themes/
      themeApi.ts
      ThemeSettingsPanel.tsx
      themeTokens.ts

  pages/
    builder/
      BuilderDashboardPage.tsx
      ProjectDetailEditorPage.tsx
      SitePageEditorPage.tsx
    public/
      PublicHomePage.tsx
      PublicProjectListPage.tsx
      PublicProjectDetailPage.tsx
      PublicAboutPage.tsx
      PublicContactPage.tsx
      PublicCategoryPage.tsx

  lib/
    apiClient.ts
    assetUrl.ts
    seo.ts

  styles/
    globals.css
    builder.css
    public-site.css
```

## Admin Editor Layout

관리자 편집 화면은 세 영역과 상단 툴바로 구성한다.

```txt
┌────────────────────────────────────────────────────────────────────┐
│ 미리보기 | 임시저장 | 게시하기 | 공개 URL                          │
├───────────────┬──────────────────────────────────┬─────────────────┤
│ Pages/Projects│ Block Editor Canvas              │ Block Inspector │
│               │                                  │                 │
│ - Home        │ [Heading Block]                  │ - 공개 여부     │
│ - Projects    │ [Project Overview Block]         │ - 배경색        │
│ - About       │ [Text Block]                     │ - 여백          │
│ - Contact     │ [PhotoGrid Block]                │ - 정렬          │
│               │ [+ Add Block]                    │ - 글자 크기     │
└───────────────┴──────────────────────────────────┴─────────────────┘
```

왼쪽 패널:

- 사이트 페이지 목록
- 프로젝트 목록
- 카테고리/컬렉션 목록
- 새 페이지/새 프로젝트 버튼
- 공개/비공개 상태 표시

가운데 캔버스:

- 블록 순서대로 편집
- 블록 클릭 시 선택 상태
- 블록 복제/삭제/위아래 이동
- 드래그 앤 드롭 정렬
- 블록 추가 버튼

오른쪽 설정 패널:

- 선택 블록의 content 편집
- 선택 블록의 settings 편집
- 공개/비공개
- 배경색, 여백, 정렬, 너비
- 글자 크기, 굵기
- 링크 URL, target 설정

## React Block Model

```ts
export type BlockType =
  | 'TEXT'
  | 'HEADING'
  | 'IMAGE'
  | 'PHOTO_GRID'
  | 'BUTTON'
  | 'DIVIDER'
  | 'QUOTE'
  | 'CALLOUT'
  | 'TABS'
  | 'TWO_COLUMN';

export type BlockSettings = {
  visible: boolean;
  backgroundColor?: string;
  paddingTop?: number;
  paddingBottom?: number;
  align?: 'left' | 'center' | 'right';
  width?: 'narrow' | 'normal' | 'wide' | 'full';
  fontSize?: 'sm' | 'md' | 'lg' | 'xl';
  fontWeight?: 'normal' | 'medium' | 'bold';
  linkUrl?: string;
};

export type Block = {
  id: number;
  pageId?: number | null;
  projectId?: number | null;
  blockType: BlockType;
  content: Record<string, unknown>;
  settings: BlockSettings;
  sortOrder: number;
  visible: boolean;
};
```

## Block Rendering Structure

블록 렌더링은 registry 패턴으로 구성한다. 관리자 미리보기와 공개 페이지가 같은 renderer를 사용한다.

```tsx
const blockRegistry: Record<BlockType, React.ComponentType<BlockRenderProps>> = {
  TEXT: TextBlock,
  HEADING: HeadingBlock,
  IMAGE: ImageBlock,
  PHOTO_GRID: PhotoGridBlock,
  BUTTON: ButtonBlock,
  DIVIDER: DividerBlock,
  QUOTE: QuoteBlock,
  CALLOUT: CalloutBlock,
  TABS: TabsBlock,
  TWO_COLUMN: TwoColumnBlock
};

export function BlockRenderer({ block, mode }: BlockRenderProps) {
  if (!block.visible && mode === 'public') return null;
  const Component = blockRegistry[block.blockType] ?? UnknownBlock;

  return (
    <BlockFrame settings={block.settings}>
      <Component block={block} mode={mode} />
    </BlockFrame>
  );
}
```

`BlockFrame`은 모든 블록 공통 설정을 적용한다.

```tsx
function BlockFrame({ settings, children }: PropsWithChildren<{ settings: BlockSettings }>) {
  return (
    <section
      className={[
        'public-block',
        `public-block-${settings.width ?? 'normal'}`,
        `public-block-align-${settings.align ?? 'left'}`
      ].join(' ')}
      style={{
        backgroundColor: settings.backgroundColor,
        paddingTop: settings.paddingTop,
        paddingBottom: settings.paddingBottom
      }}
    >
      {children}
    </section>
  );
}
```

## MVP Block Content Shapes

### Text

```json
{
  "text": "프로젝트 설명입니다."
}
```

### Heading

```json
{
  "text": "문제 정의",
  "level": 2
}
```

### Image

```json
{
  "url": "https://example.com/image.jpg",
  "alt": "서비스 화면",
  "caption": "개선 후 홈 화면"
}
```

### Photo Grid

```json
{
  "images": [
    {
      "url": "https://example.com/a.jpg",
      "alt": "와이어프레임",
      "caption": "초기 와이어프레임"
    }
  ],
  "columns": 3,
  "gap": 16
}
```

### Button

```json
{
  "label": "사이트 보기",
  "url": "https://example.com",
  "target": "_blank"
}
```

### Divider

```json
{
  "style": "line"
}
```

### Quote

```json
{
  "text": "핵심은 사용자가 빠르게 포트폴리오를 완성하도록 돕는 것이었습니다.",
  "cite": "프로젝트 회고"
}
```

### Callout

```json
{
  "icon": "idea",
  "title": "핵심 포인트",
  "text": "이 프로젝트의 핵심은 사용자 경험 개선입니다."
}
```

### Tabs

```json
{
  "tabs": [
    {
      "title": "기획",
      "content": "기획 과정 설명"
    },
    {
      "title": "디자인",
      "content": "디자인 과정 설명"
    },
    {
      "title": "개발",
      "content": "개발 과정 설명"
    }
  ]
}
```

### Two Column

```json
{
  "left": [
    {
      "type": "HEADING",
      "content": {
        "text": "문제"
      }
    }
  ],
  "right": [
    {
      "type": "TEXT",
      "content": {
        "text": "문제 설명"
      }
    }
  ],
  "ratio": "1:1"
}
```

## Database Design

현재 코드베이스에는 인증 기반 기존 `projects` 테이블이 이미 있다.
그래서 이 문서의 프로젝트 상세 블록 편집 MVP는 기존 기능을 깨지 않기 위해 `builder_projects` 테이블로 구현한다.
장기적으로 멀티 사용자 빌더가 안정화되면 기존 `projects`와 `builder_projects`를 하나의 `projects` 모델로 통합할 수 있다.

### users

```sql
create table users (
  id bigserial primary key,
  email varchar(255) not null unique,
  password_hash varchar(255) not null,
  name varchar(100) not null,
  role varchar(30) not null default 'USER',
  created_at timestamp not null,
  updated_at timestamp not null
);
```

### sites

```sql
create table sites (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  theme_id bigint references themes(id) on delete set null,
  slug varchar(100) not null unique,
  title varchar(120) not null,
  description text,
  profile_image_url varchar(500),
  is_published boolean not null default false,
  created_at timestamp not null,
  updated_at timestamp not null
);
```

### pages

```sql
create table pages (
  id bigserial primary key,
  site_id bigint not null references sites(id) on delete cascade,
  title varchar(160) not null,
  slug varchar(160) not null,
  page_type varchar(40) not null default 'CUSTOM',
  is_public boolean not null default true,
  nav_visible boolean not null default true,
  sort_order int not null default 0,
  seo_title varchar(180),
  seo_description varchar(300),
  created_at timestamp not null,
  updated_at timestamp not null,
  unique(site_id, slug)
);
```

### projects

```sql
create table projects (
  id bigserial primary key,
  site_id bigint not null references sites(id) on delete cascade,
  title varchar(200) not null,
  slug varchar(200) not null,
  subtitle varchar(240),
  summary text,
  description text,
  period varchar(120),
  role varchar(160),
  contribution varchar(120),
  thumbnail_url varchar(500),
  github_url varchar(500),
  live_url varchar(500),
  visibility varchar(30) not null default 'PRIVATE',
  sort_order int not null default 0,
  seo_title varchar(180),
  seo_description varchar(300),
  created_at timestamp not null,
  updated_at timestamp not null,
  unique(site_id, slug)
);
```

### blocks

`blocks`는 페이지 블록과 프로젝트 상세 페이지 블록을 모두 담는다.
둘 중 하나만 연결되도록 애플리케이션 레벨에서 검증한다.

```sql
create table blocks (
  id bigserial primary key,
  page_id bigint references pages(id) on delete cascade,
  project_id bigint references projects(id) on delete cascade,
  block_type varchar(60) not null,
  content jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamp not null,
  updated_at timestamp not null,
  check (
    (page_id is not null and project_id is null)
    or
    (page_id is null and project_id is not null)
  )
);

create index idx_blocks_page_order on blocks(page_id, sort_order);
create index idx_blocks_project_order on blocks(project_id, sort_order);
```

### block_settings

MVP에서는 `blocks.settings` JSONB로 충분하다.
블록 설정 검색/필터/분석이 중요해지면 별도 테이블로 분리한다.

```sql
create table block_settings (
  id bigserial primary key,
  block_id bigint not null unique references blocks(id) on delete cascade,
  background_color varchar(30),
  padding_top int,
  padding_bottom int,
  align varchar(20),
  width varchar(20),
  font_size varchar(20),
  font_weight varchar(20),
  link_url varchar(500),
  created_at timestamp not null,
  updated_at timestamp not null
);
```

### media_files

```sql
create table media_files (
  id bigserial primary key,
  site_id bigint not null references sites(id) on delete cascade,
  project_id bigint references projects(id) on delete set null,
  url varchar(500) not null,
  original_name varchar(255),
  mime_type varchar(120),
  size_bytes bigint,
  alt_text varchar(255),
  caption varchar(500),
  created_at timestamp not null
);
```

### categories

```sql
create table categories (
  id bigserial primary key,
  site_id bigint not null references sites(id) on delete cascade,
  name varchar(100) not null,
  slug varchar(100) not null,
  sort_order int not null default 0,
  created_at timestamp not null,
  updated_at timestamp not null,
  unique(site_id, slug)
);
```

### project_categories

```sql
create table project_categories (
  project_id bigint not null references projects(id) on delete cascade,
  category_id bigint not null references categories(id) on delete cascade,
  primary key (project_id, category_id)
);
```

### themes

```sql
create table themes (
  id bigserial primary key,
  site_id bigint references sites(id) on delete cascade,
  name varchar(100) not null,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamp not null,
  updated_at timestamp not null
);
```

## Backend Package Structure

```txt
backend/src/main/java/com/example/portfolio
  api/
    auth/
    builder/
      SiteBuilderController.java
      PageBuilderController.java
      ProjectBuilderController.java
      BlockController.java
      MediaController.java
      dto/
    publicsite/
      PublicSiteController.java
      PublicProjectController.java
      dto/

  domain/
    user/
    site/
    page/
    project/
    block/
    media/
    category/
    theme/

  service/
    SiteService.java
    PageService.java
    ProjectService.java
    BlockService.java
    MediaService.java
    PublicRenderService.java

  security/
  storage/
  common/
```

## Backend API Specification

Base URL: `/api`

### Sites

- `GET /builder/sites`
- `POST /builder/sites`
- `GET /builder/sites/{siteId}`
- `PATCH /builder/sites/{siteId}`
- `POST /builder/sites/{siteId}/publish`

```json
{
  "title": "나의 포트폴리오",
  "slug": "my-portfolio",
  "description": "프로젝트와 작업 과정을 보여주는 사이트",
  "profileImageUrl": "/uploads/profile.jpg",
  "themeId": 1
}
```

### Pages

- `GET /builder/sites/{siteId}/pages`
- `POST /builder/sites/{siteId}/pages`
- `PATCH /builder/pages/{pageId}`
- `DELETE /builder/pages/{pageId}`
- `PATCH /builder/sites/{siteId}/pages/reorder`

```json
{
  "title": "About",
  "slug": "about",
  "pageType": "ABOUT",
  "publicPage": true,
  "navVisible": true,
  "sortOrder": 2
}
```

### Projects

- `GET /builder/sites/{siteId}/projects`
- `POST /builder/sites/{siteId}/projects`
- `GET /builder/projects/{projectId}`
- `PATCH /builder/projects/{projectId}`
- `DELETE /builder/projects/{projectId}`
- `PATCH /builder/sites/{siteId}/projects/reorder`

```json
{
  "title": "Portfolio Builder",
  "subtitle": "블록 기반 포트폴리오 제작 플랫폼",
  "summary": "React와 Spring Boot로 만든 웹 게시 플랫폼",
  "period": "2026.06 - 2026.07",
  "role": "Full-stack Developer",
  "contribution": "100%",
  "techStacks": ["React", "Spring Boot", "PostgreSQL"],
  "githubUrl": "https://github.com/user/repo",
  "liveUrl": "https://example.com",
  "visibility": "PUBLIC"
}
```

### Blocks

페이지 블록:

- `GET /builder/pages/{pageId}/blocks`
- `POST /builder/pages/{pageId}/blocks`

프로젝트 상세 블록:

- `GET /builder/projects/{projectId}/blocks`
- `POST /builder/projects/{projectId}/blocks`

공통:

- `PATCH /builder/blocks/{blockId}`
- `DELETE /builder/blocks/{blockId}`
- `POST /builder/blocks/{blockId}/duplicate`
- `PATCH /builder/blocks/reorder`

```json
{
  "blockType": "CALLOUT",
  "content": {
    "icon": "idea",
    "title": "핵심 포인트",
    "text": "이 프로젝트의 핵심은 사용자 경험 개선입니다."
  },
  "settings": {
    "visible": true,
    "backgroundColor": "#f7f4ee",
    "paddingTop": 32,
    "paddingBottom": 32,
    "align": "left",
    "width": "normal",
    "fontSize": "md",
    "fontWeight": "normal"
  },
  "sortOrder": 4,
  "visible": true
}
```

Reorder:

```json
{
  "blockIds": [12, 15, 13, 14]
}
```

### Media

- `GET /builder/sites/{siteId}/media`
- `POST /builder/sites/{siteId}/media`
- `DELETE /builder/media/{mediaId}`

Upload uses `multipart/form-data`:

- `file`: binary
- `altText`: optional
- `caption`: optional

### Public Site

- `GET /public/sites/{siteSlug}`
- `GET /public/sites/{siteSlug}/pages/{pageSlug}`
- `GET /public/sites/{siteSlug}/projects`
- `GET /public/sites/{siteSlug}/projects/{projectSlug}`
- `GET /public/sites/{siteSlug}/categories/{categorySlug}`

Project detail response:

```json
{
  "site": {
    "title": "나의 포트폴리오",
    "slug": "my-portfolio",
    "theme": {
      "settings": {}
    }
  },
  "project": {
    "id": 1,
    "title": "Portfolio Builder",
    "subtitle": "블록 기반 포트폴리오 제작 플랫폼",
    "period": "2026.06 - 2026.07",
    "role": "Full-stack Developer",
    "contribution": "100%"
  },
  "blocks": [
    {
      "id": 10,
      "blockType": "HEADING",
      "content": {
        "text": "문제 정의",
        "level": 2
      },
      "settings": {
        "width": "normal"
      },
      "sortOrder": 0,
      "visible": true
    }
  ]
}
```

## Public Rendering Pages

```txt
/                      landing or redirect to public home
/{siteSlug}            public home
/{siteSlug}/projects   project list
/{siteSlug}/projects/{projectSlug}
/{siteSlug}/about
/{siteSlug}/contact
/{siteSlug}/categories/{categorySlug}
```

공개 페이지 렌더링 원칙:

- 공개 페이지에서는 `visible = false` 블록을 렌더링하지 않는다.
- 프로젝트 상세 페이지의 모든 섹션은 `blocks`에서 렌더링한다.
- 프로젝트 기본 정보는 `projects` 컬럼에서 가져오되, 화면에 보이는 텍스트는 block으로 덮어쓸 수 있다.
- 이미지 URL은 `media_files` 또는 외부 URL 모두 허용한다.
- SEO title/description은 site, page, project 순서로 병합한다.

## Implementation Phases

### Phase 1. MVP

- `blocks.settings` JSONB 추가
- 프로젝트 상세 페이지용 block CRUD API
- 텍스트, 제목, 이미지, 포토그리드, 버튼, 구분선, 인용, 콜아웃, 탭, 2단 레이아웃
- 관리자 3패널 편집 화면
- 공개 프로젝트 상세 렌더링

### Phase 2. Editing UX

- 블록 복제
- 드래그 앤 드롭 정렬
- Media Library
- 임시저장/게시 상태 분리
- Undo/Redo

### Phase 3. Advanced Blocks

- 갤러리, 슬라이더, 아코디언, 코드, 표
- GitHub/Figma/Notion/Render 카드
- CTA, FAQ, 통계 카드, 진행률/스킬 바

### Phase 4. Publishing Platform

- 사용자별 사이트 여러 개
- 템플릿 저장/적용
- 커스텀 도메인
- 방문자 통계
- 이미지 최적화와 CDN/S3 연동
