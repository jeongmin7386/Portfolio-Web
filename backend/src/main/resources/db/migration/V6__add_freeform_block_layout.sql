alter table blocks add column section_id varchar(120);
alter table blocks add column styles jsonb not null default '{}'::jsonb;
alter table blocks add column layout jsonb not null default '{}'::jsonb;

update blocks set styles = settings where styles = '{}'::jsonb and settings is not null;
