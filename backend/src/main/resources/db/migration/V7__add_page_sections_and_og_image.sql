alter table pages add column sections jsonb not null default '[]'::jsonb;
alter table pages add column seo_og_image varchar(500);
