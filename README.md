# Portfolio Publisher MVP

Adobe Portfolio 스타일의 공개 그리드 포트폴리오와 Notion처럼 빠르게 편집하는 관리자 UI를 결합한 MVP입니다.

## Stack

- Frontend: React, TypeScript, Vite, React Router, TanStack Query, Axios
- Backend: Spring Boot, Spring Security, Spring Data JPA, Flyway
- Database: PostgreSQL
- Storage: Local file storage for MVP, `StorageService` interface로 S3 확장 가능

## Run

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

## MVP Features

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

## Future Extension Points

- `blocks.content` JSONB에 블록별 속성을 저장하므로 갤러리, 영상, 코드, 링크 카드, 컬럼 레이아웃을 테이블 변경 없이 추가할 수 있습니다.
- `sortOrder` 필드는 페이지/블록 드래그 정렬 API로 바로 연결할 수 있습니다.
- `sites.user_id`를 인증 사용자와 연결하면 단일 사용자 MVP를 멀티 사용자 사이트 빌더로 확장할 수 있습니다.
- `themes.settings`와 JSON template config를 조합하면 템플릿 기능으로 확장됩니다.
- 공개 조회 API 앞단에 view logging을 추가하면 방문자 통계를 붙일 수 있습니다.

More details:

- API: `docs/API.md`
- Architecture: `docs/ARCHITECTURE.md`
- Project detail block editor spec: `docs/PROJECT_DETAIL_BLOCK_EDITOR_SPEC.md`

## Render Deploy

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
