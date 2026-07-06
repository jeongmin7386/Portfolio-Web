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

## Future Extension Points

- `ProjectBlock` 테이블을 추가하면 Notion식 블록 에디터로 확장할 수 있습니다.
- `sortOrder` 필드는 드래그 정렬 API로 바로 연결할 수 있습니다.
- `PortfolioProfile.theme`과 JSON template config를 추가하면 템플릿 기능으로 확장됩니다.
- 공개 조회 API 앞단에 view logging을 추가하면 방문자 통계를 붙일 수 있습니다.

More details:

- API: `docs/API.md`
- Architecture: `docs/ARCHITECTURE.md`

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
