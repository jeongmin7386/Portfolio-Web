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
