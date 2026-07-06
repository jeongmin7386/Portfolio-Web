# API Specification

Base URL: `http://localhost:8080/api`

## Auth

### `POST /auth/signup`

```json
{
  "email": "user@example.com",
  "password": "password123!",
  "name": "홍길동",
  "portfolioSlug": "gildong"
}
```

### `POST /auth/login`

```json
{
  "email": "user@example.com",
  "password": "password123!"
}
```

Response:

```json
{
  "accessToken": "jwt",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "홍길동"
  }
}
```

### `GET /me`

Requires `Authorization: Bearer {token}`.

## Admin

All admin APIs require `Authorization: Bearer {token}`.

### Profile

- `GET /admin/profile`
- `PATCH /admin/profile`

```json
{
  "slug": "gildong",
  "displayName": "홍길동",
  "bio": "프론트엔드 개발자입니다.",
  "profileImageUrl": "",
  "theme": "MINIMAL_GRID",
  "publicProfile": true
}
```

### Categories

- `GET /admin/categories`
- `POST /admin/categories`
- `PATCH /admin/categories/{categoryId}`
- `DELETE /admin/categories/{categoryId}`

```json
{
  "name": "Frontend",
  "sortOrder": 0
}
```

### Projects

- `GET /admin/projects`
- `POST /admin/projects`
- `GET /admin/projects/{projectId}`
- `PATCH /admin/projects/{projectId}`
- `DELETE /admin/projects/{projectId}`
- `POST /admin/projects/{projectId}/thumbnail`
- `PATCH /admin/projects/reorder`

```json
{
  "title": "Portfolio Builder",
  "description": "React와 Spring Boot 기반 포트폴리오 게시 플랫폼",
  "categoryId": 1,
  "techStacks": ["React", "Spring Boot", "PostgreSQL"],
  "githubUrl": "https://github.com/user/project",
  "liveUrl": "https://example.com",
  "visibility": "PUBLIC",
  "sortOrder": 0
}
```

Thumbnail upload uses `multipart/form-data` with a `file` field.

Reorder:

```json
{
  "projectIds": [3, 1, 5, 2]
}
```

## Public

- `GET /public/portfolios/{slug}`
- `GET /public/portfolios/{slug}?category=frontend`
- `GET /public/portfolios/{slug}/projects`
- `GET /public/portfolios/{slug}/projects?category=frontend`
- `GET /public/portfolios/{slug}/projects/{projectSlug}`

## Loginless Site Builder MVP

The block builder MVP is intentionally open and single-user for fast prototyping.
It is mounted under `/builder` on the frontend and `/api/builder` on the backend.

### Builder State

- `GET /builder`

Response:

```json
{
  "site": {
    "id": 1,
    "slug": "my-portfolio",
    "title": "나의 포트폴리오",
    "description": "프로젝트와 작업 과정을 보여주는 개인 포트폴리오입니다.",
    "profileImageUrl": null,
    "published": true,
    "theme": {
      "id": 1,
      "name": "Studio Minimal",
      "settings": {
        "accentColor": "#111111",
        "fontFamily": "Pretendard",
        "background": "#f7f4ee",
        "radius": 8,
        "spacing": 32
      }
    }
  },
  "pages": [
    {
      "id": 1,
      "siteId": 1,
      "title": "홈",
      "slug": "home",
      "pageType": "HOME",
      "publicPage": true,
      "navVisible": true,
      "sortOrder": 0
    }
  ]
}
```

### Site Settings

- `PATCH /builder/site`

```json
{
  "slug": "my-portfolio",
  "title": "나의 포트폴리오",
  "description": "작업과 과정을 보여주는 포트폴리오입니다.",
  "profileImageUrl": "",
  "published": true,
  "themeId": 1
}
```

### Pages

- `GET /builder/pages`
- `POST /builder/pages`
- `GET /builder/pages/{pageId}`
- `PATCH /builder/pages/{pageId}`
- `DELETE /builder/pages/{pageId}`
- `PATCH /builder/pages/reorder`

Page payload:

```json
{
  "title": "프로젝트",
  "slug": "projects",
  "pageType": "PROJECTS",
  "publicPage": true,
  "navVisible": true,
  "sortOrder": 1,
  "seoTitle": "프로젝트 | 나의 포트폴리오",
  "seoDescription": "대표 프로젝트 모음"
}
```

Reorder payload:

```json
{
  "ids": [3, 1, 2]
}
```

### Blocks

- `GET /builder/pages/{pageId}/blocks`
- `POST /builder/pages/{pageId}/blocks`
- `PATCH /builder/pages/{pageId}/blocks/{blockId}`
- `DELETE /builder/pages/{pageId}/blocks/{blockId}`
- `PATCH /builder/pages/{pageId}/blocks/reorder`

Block payload:

```json
{
  "blockType": "PROJECT_CARD",
  "content": {
    "title": "Portfolio Builder",
    "description": "페이지와 블록 기반 포트폴리오 제작 플랫폼",
    "imageUrl": "https://example.com/cover.jpg",
    "href": "https://example.com"
  },
  "sortOrder": 2
}
```

MVP block types:

- `HEADING`
- `TEXT`
- `IMAGE`
- `DIVIDER`
- `QUOTE`
- `CALLOUT`
- `BUTTON`
- `PROJECT_CARD`

The schema also reserves enum values for later blocks:

- `GALLERY`
- `VIDEO_EMBED`
- `CODE`
- `LINK_CARD`
- `TECH_STACK`
- `COLUMNS`
- `PROJECT_INFO`
- `GITHUB_LINK`
- `LIVE_LINK`

### Public Block Site

- `GET /public/site`
- `GET /public/site/{slug}`

Response:

```json
{
  "site": {
    "id": 1,
    "slug": "my-portfolio",
    "title": "나의 포트폴리오",
    "published": true
  },
  "pages": [
    {
      "page": {
        "id": 1,
        "title": "홈",
        "slug": "home",
        "pageType": "HOME",
        "publicPage": true,
        "navVisible": true,
        "sortOrder": 0
      },
      "blocks": [
        {
          "id": 1,
          "pageId": 1,
          "blockType": "TEXT",
          "content": {
            "text": "본문을 입력하세요."
          },
          "sortOrder": 0
        }
      ]
    }
  ]
}
```
