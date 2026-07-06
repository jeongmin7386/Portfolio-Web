# Architecture

## Frontend

```txt
frontend/src
  app            router and query client
  components     reusable layout and UI primitives
  features       auth, projects, categories API modules and feature components
  pages          route-level screens
  lib            shared API client and types
  styles         global responsive styles
```

## Backend

```txt
backend/src/main/java/com/example/portfolio
  api            auth, admin, and public REST controllers
  domain         JPA entities and repositories
  security       JWT, Spring Security, current user principal
  storage        local storage interface and implementation
  common         shared config, errors, utility classes
```

## Database

The MVP schema is managed by Flyway in `backend/src/main/resources/db/migration/V1__init.sql`.

Main tables:

- `users`
- `portfolio_profiles`
- `categories`
- `projects`
- `project_images`

## Extension Points

Block editor:

```sql
create table project_blocks (
  id bigserial primary key,
  project_id bigint not null references projects(id) on delete cascade,
  type varchar(50) not null,
  content jsonb not null,
  sort_order int not null default 0,
  created_at timestamp not null,
  updated_at timestamp not null
);
```

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
