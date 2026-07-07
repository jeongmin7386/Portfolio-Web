# Architecture

## Frontend

```txt
frontend/src
  app                 router and query client
  components          reusable layout and UI primitives
  editor              project preview/editor panels from the first MVP
  features
    auth              auth/profile API modules
    categories        category API modules
    project-management
    projects          project CRUD/public API modules
    site-builder      page/block builder API, block catalog, block renderer/editor
    theme-settings    theme draft options
  pages
    auth
    builder           loginless single-user block builder MVP
    dashboard         authenticated project dashboard
    landing
    public            public portfolio and block-site renderers
  templates           portfolio template catalog/cards
  lib                 shared API client and types
  styles              global responsive styles
```

### Site Builder React Components

```txt
features/site-builder
  blockCatalog.ts                  block labels and default JSON content
  siteBuilderApi.ts                /api/builder and /api/public/site client
  types.ts                         Site/Page/Block DTO types
  components/
    BlockPalette.tsx               block add controls
    BlockEditorCard.tsx            per-block form editor
    BlockRenderer.tsx              shared preview/public renderer

pages/builder/BuilderMvpPage.tsx   Pages panel + preview canvas + inspector
pages/public/SiteBuilderPublicPage.tsx
```

## Backend

```txt
backend/src/main/java/com/example/portfolio
  api
    auth                signup/login
    admin               authenticated profile/category/project APIs
    builder             loginless single-user site/page/block MVP APIs
    publicportfolio     first-MVP public project portfolio APIs
    health
  domain
    block               blocks table and BlockType enum
    category
    media               media_files table
    page                pages table and PageType enum
    profile
    project
    site                sites table
    theme               themes table
    user
  security       JWT, Spring Security, current user principal
  storage        local storage interface and implementation
  common         shared config, errors, utility classes
```

## Database

The schema is managed by Flyway in `backend/src/main/resources/db/migration`.

Main tables:

- `users`
- `portfolio_profiles`
- `categories`
- `projects`
- `project_images`
- `themes`
- `sites`
- `pages`
- `blocks`
- `media_files`

### Block Builder Tables

```sql
create table sites (
  id bigserial primary key,
  user_id bigint references users(id) on delete set null,
  theme_id bigint references themes(id) on delete set null,
  slug varchar(100) not null unique,
  title varchar(120) not null,
  description text,
  profile_image_url varchar(500),
  is_published boolean not null default true,
  created_at timestamp not null,
  updated_at timestamp not null
);

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

create table blocks (
  id bigserial primary key,
  page_id bigint not null references pages(id) on delete cascade,
  block_type varchar(60) not null,
  content jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  created_at timestamp not null,
  updated_at timestamp not null
);
```

`blocks.content` is intentionally JSONB. Each block stores its own shape:

- `TEXT`: `{ "text": "..." }`
- `IMAGE`: `{ "imageUrl": "...", "alt": "...", "caption": "..." }`
- `QUOTE`: `{ "text": "...", "cite": "..." }`
- `CALLOUT`: `{ "tone": "neutral", "text": "..." }`
- `BUTTON`: `{ "label": "...", "href": "..." }`
- `PROJECT_CARD`: `{ "title": "...", "description": "...", "imageUrl": "...", "href": "..." }`

## Extension Points

- Authenticated multi-user sites: set `sites.user_id` from the logged-in principal and scope builder queries by user.
- Drag sorting: wire UI drag events to `PATCH /api/builder/pages/reorder` and `PATCH /api/builder/pages/{pageId}/blocks/reorder`.
- Media upload: store uploads in `media_files`, then reference returned URLs from image/gallery blocks.
- Template system: save reusable page/block/theme bundles in a future `site_templates` table.

Templates:

```sql
create table portfolio_templates (
  id bigserial primary key,
  name varchar(100) not null,
  theme varchar(50) not null,
  config jsonb not null,
  created_at timestamp not null
);
```

Visitor analytics:

```sql
create table portfolio_views (
  id bigserial primary key,
  profile_id bigint not null references portfolio_profiles(id),
  project_id bigint references projects(id),
  path varchar(500),
  referrer varchar(500),
  user_agent text,
  ip_hash varchar(255),
  viewed_at timestamp not null
);
```
