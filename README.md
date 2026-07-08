# Portfolio Web

이 저장소는 기존 `Portfolio Publisher MVP`와 새 `Studio Archive` 포트폴리오 사이트를 함께 포함합니다.

## Portfolio Publisher MVP

Adobe Portfolio 스타일의 공개 그리드 포트폴리오와 Notion처럼 빠르게 편집하는 관리자 UI를 결합한 MVP입니다.

### Stack

- Frontend: React, TypeScript, Vite, React Router, TanStack Query, Axios
- Backend: Spring Boot, Spring Security, Spring Data JPA, Flyway
- Database: PostgreSQL
- Storage: Local file storage for MVP, `StorageService` interface로 S3 확장 가능

### Run

Prerequisites:

- Java 21
- Maven 3.9+
- Node.js 20+
- Docker Desktop or a local PostgreSQL 16+

This workspace includes local Java and Maven tools under `work/tools`.

Backend build with bundled tools:

```powershell
powershell.exe -ExecutionPolicy Bypass -File scripts\build-backend.ps1
```

```powershell
docker compose up -d
```

Backend:

```powershell
powershell.exe -ExecutionPolicy Bypass -File scripts\run-backend.ps1
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

Default URLs:

- Frontend: http://localhost:5173
- Backend: http://localhost:8080
- Public portfolio: `http://localhost:5173/{portfolioSlug}`
- Loginless block builder MVP: http://localhost:5173/builder
- Block-site public preview: http://localhost:5173/site

### MVP Features

- 회원가입/로그인
- JWT 인증
- 관리자 대시보드
- 프로젝트 CRUD
- 썸네일 이미지 업로드
- 카테고리 CRUD
- 공개/비공개 설정
- 공개 포트폴리오 자동 생성
- 카테고리 필터링
- 반응형 그리드 UI
- 로그인 없는 단일 사용자 블록 사이트 빌더(`/builder`)
- 새 페이지 생성/수정/삭제
- 텍스트, 이미지, 구분선, 인용, 콜아웃, 버튼, 프로젝트 카드 블록
- 블록 기반 공개 사이트 자동 렌더링(`/site`)

### Future Extension Points

- `blocks.content` JSONB에 블록별 속성을 저장하므로 갤러리, 영상, 코드, 링크 카드, 컬럼 레이아웃을 테이블 변경 없이 추가할 수 있습니다.
- `sortOrder` 필드는 페이지/블록 드래그 정렬 API로 바로 연결할 수 있습니다.
- `sites.user_id`를 인증 사용자와 연결하면 단일 사용자 MVP를 멀티 사용자 사이트 빌더로 확장할 수 있습니다.
- `themes.settings`와 JSON template config를 조합하면 템플릿 기능으로 확장됩니다.
- 공개 조회 API 앞단에 view logging을 추가하면 방문자 통계를 붙일 수 있습니다.

More details:

- API: `docs/API.md`
- Architecture: `docs/ARCHITECTURE.md`
- Project detail block editor spec: `docs/PROJECT_DETAIL_BLOCK_EDITOR_SPEC.md`

### Render Deploy

The repository includes `render.yaml` for a Render Blueprint deployment:

- `portfolio-web-api`: Spring Boot Docker web service
- `portfolio-web`: React static site
- `portfolio-web-db`: Render Postgres

Steps:

1. Push this repository to GitHub.
2. In Render, create a new Blueprint and select the GitHub repository.
3. Render reads `render.yaml` and provisions the API, static site, and database.
4. After the first deploy, open the `portfolio-web` static site URL.

Notes:

- Render provides `DATABASE_URL`; the backend converts it to a JDBC URL at startup.
- The backend listens on Render's `PORT` environment variable.
- The frontend receives the API hostname from the backend service and normalizes it to `https://.../api`.
- Uploaded thumbnails use `/tmp/uploads` on Render. This is suitable for MVP testing, but files are ephemeral across redeploys/restarts. Use S3-compatible storage or a paid persistent disk before production use.

## Studio Archive

Notion-style content management and Adobe Portfolio-style case study presentation for a personal design portfolio.

### Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- JSON content files under `content/projects` and `content/notes`

### Run

From the repository root:

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

On Windows PowerShell, if script execution blocks `npm`, use:

```powershell
npm.cmd install
npm.cmd run dev
```

### Scripts

```bash
npm run lint
npm run build
npm run typecheck
```

### Admin, DB, and Uploads

Admin paths:

- `/admin`: project, category, and archive note management
- `/admin/editor`: live responsive page builder
- `/admin/projects`: project editor with live public preview
- `/admin/archive`: archive note editor with live public preview
- `/admin/accounts`: account approval screen for the site owner
- `/admin/login`: admin account login, owner login, and account request form

Storage behavior:

- If `DATABASE_URL` or `STUDIO_ARCHIVE_DATABASE_URL` is set, Studio Archive stores editable content in Postgres.
- If no database URL is set, it falls back to `data/studio-archive-content.json`.
- When the Postgres table is empty, the app seeds it from `content/projects` and `content/notes`.
- Page builder data is stored as JSON in `studio_archive_pages.sections`.
- Without a database, page builder data falls back to `data/studio-archive-page-home.json`.
- Admin account requests are stored in `studio_archive_admin_users` when Postgres is available.
- Without a database, admin account requests fall back to `data/studio-archive-admin-users.json`.

Page builder:

- `/admin/editor` has a three-panel editing layout: section library, live canvas, and settings panel.
- The canvas can switch between desktop, tablet, and mobile preview widths.
- Sections and blocks can be added, selected, duplicated, deleted, and reordered with drag and drop.
- The public home page (`/`) renders the saved page JSON with the same renderer used by the editor preview.

Recommended Render environment variables for the `studio-archive` service:

```bash
DATABASE_URL=...                 # Render Postgres connection string
STUDIO_ARCHIVE_ADMIN_PASSWORD=... # owner password for login and account approval
STUDIO_ARCHIVE_AUTH_SECRET=...    # generated secret for signed admin cookies
STUDIO_ARCHIVE_UPLOAD_DIR=/tmp/studio-archive-uploads
```

Admin account flow:

1. The site owner logs in from `/admin/login` with the owner password.
2. Other users open `/admin/login`, choose the request tab, and submit name, email, and password.
3. The owner opens `/admin/accounts` and approves or rejects pending requests.
4. Approved users can log in with email and password. Pending or rejected users cannot access admin pages.

In production, admin login protection is enabled by default. Keep `STUDIO_ARCHIVE_ADMIN_PASSWORD` and `STUDIO_ARCHIVE_AUTH_SECRET` set on Render so only the owner can approve new accounts.

Image uploads:

- In `/admin`, image fields support both direct URL input and file upload.
- Uploaded files are served from `/uploads/[filename]`.
- `/tmp/studio-archive-uploads` is enough for MVP testing, but files are ephemeral on Render.
- For production, attach a Render Persistent Disk or replace `lib/uploads.ts` with S3/R2 storage.

### Content Structure

Projects are stored as JSON files in `content/projects`.
Each project file is loaded by `lib/content.ts`, so adding a new JSON file with a unique `slug` automatically creates:

- a project card on `/projects`
- a detail page at `/projects/[slug]`
- a possible home feature if `featured` is `true`

Notes are stored in `content/notes` and appear on `/archive`.

### Project Model

```ts
type Project = {
  slug: string;
  title: string;
  subtitle: string;
  year: string;
  period: string;
  role: string;
  client: string;
  category: string;
  tags: string[];
  coverImage: string;
  description: string;
  tools: string[];
  deliverables: string[];
  blocks: ProjectBlock[];
  featured?: boolean;
};
```

Supported block types:

- `heading`
- `paragraph`
- `image`
- `imageGrid`
- `quote`
- `twoColumn`
- `stats`
- `process`
- `result`

### Adding a Project

1. Add images to `public/images`, preferably using a `/images/placeholder-*` path while drafting.
2. Copy one existing JSON file in `content/projects`.
3. Change `slug`, metadata, `coverImage`, and `blocks`.
4. Run `npm run dev` and visit `/projects/[slug]`.

### Key Files

- `lib/types.ts`: shared content types
- `lib/content.ts`: filesystem content loader, future CMS/Notion API boundary
- `components/block-renderer.tsx`: Notion-like case study block renderer
- `components/project-explorer.tsx`: project category filtering
- `app/projects/[slug]/page.tsx`: generated project detail route
