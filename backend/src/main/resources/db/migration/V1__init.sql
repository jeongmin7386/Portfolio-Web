create table users (
  id bigserial primary key,
  email varchar(255) not null unique,
  password_hash varchar(255) not null,
  name varchar(100) not null,
  role varchar(30) not null default 'USER',
  created_at timestamp not null,
  updated_at timestamp not null
);

create table portfolio_profiles (
  id bigserial primary key,
  user_id bigint not null unique references users(id) on delete cascade,
  slug varchar(100) not null unique,
  display_name varchar(100) not null,
  bio text,
  profile_image_url varchar(500),
  theme varchar(50) default 'MINIMAL_GRID',
  is_public boolean not null default true,
  created_at timestamp not null,
  updated_at timestamp not null
);

create table categories (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  name varchar(100) not null,
  slug varchar(100) not null,
  sort_order int not null default 0,
  created_at timestamp not null,
  updated_at timestamp not null,
  unique(user_id, slug)
);

create table projects (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  category_id bigint references categories(id) on delete set null,
  title varchar(200) not null,
  slug varchar(200) not null,
  description text,
  thumbnail_url varchar(500),
  tech_stacks text[] not null default '{}',
  github_url varchar(500),
  live_url varchar(500),
  visibility varchar(30) not null default 'PRIVATE',
  sort_order int not null default 0,
  created_at timestamp not null,
  updated_at timestamp not null,
  unique(user_id, slug)
);

create table project_images (
  id bigserial primary key,
  project_id bigint not null references projects(id) on delete cascade,
  image_url varchar(500) not null,
  alt_text varchar(255),
  sort_order int not null default 0,
  created_at timestamp not null
);

create index idx_projects_user_visibility on projects(user_id, visibility);
create index idx_projects_category on projects(category_id);
create index idx_categories_user on categories(user_id);
