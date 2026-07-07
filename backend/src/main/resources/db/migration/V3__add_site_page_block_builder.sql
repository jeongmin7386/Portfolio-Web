create table themes (
  id bigserial primary key,
  name varchar(100) not null,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamp not null,
  updated_at timestamp not null
);

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

create table media_files (
  id bigserial primary key,
  site_id bigint not null references sites(id) on delete cascade,
  url varchar(500) not null,
  original_name varchar(255),
  mime_type varchar(120),
  size_bytes bigint,
  alt_text varchar(255),
  created_at timestamp not null
);

create index idx_pages_site_order on pages(site_id, sort_order);
create index idx_blocks_page_order on blocks(page_id, sort_order);
create index idx_media_files_site on media_files(site_id);
