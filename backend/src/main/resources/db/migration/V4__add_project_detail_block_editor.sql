create table builder_projects (
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
  tech_stacks text[] not null default '{}',
  github_url varchar(500),
  live_url varchar(500),
  visibility varchar(30) not null default 'PUBLIC',
  sort_order int not null default 0,
  seo_title varchar(180),
  seo_description varchar(300),
  created_at timestamp not null,
  updated_at timestamp not null,
  unique(site_id, slug)
);

alter table blocks alter column page_id drop not null;
alter table blocks add column project_id bigint references builder_projects(id) on delete cascade;
alter table blocks add column settings jsonb not null default '{}'::jsonb;
alter table blocks add column is_visible boolean not null default true;

alter table blocks add constraint chk_blocks_owner check (
  (page_id is not null and project_id is null)
  or
  (page_id is null and project_id is not null)
);

create index idx_builder_projects_site_order on builder_projects(site_id, sort_order);
create index idx_builder_projects_site_visibility on builder_projects(site_id, visibility);
create index idx_blocks_project_order on blocks(project_id, sort_order);
