begin;

create extension if not exists pgcrypto with schema extensions;
create extension if not exists postgis with schema extensions;

create type public.user_role as enum ('admin','editor','reviewer','viewer');
create type public.content_status as enum ('draft','review','scheduled','published','archived');
create type public.post_type as enum ('noticia','publicacao');
create type public.mineral_category as enum ('critico','estrategico');
create type public.run_status as enum ('queued','running','completed','failed','cancelled');
create type public.layer_status as enum ('pending','processing','ready','failed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.user_role not null default 'viewer',
  institution text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  type public.post_type not null,
  status public.content_status not null default 'draft',
  title text not null check (char_length(title) between 8 and 240),
  excerpt text not null check (char_length(excerpt) between 20 and 600),
  body text not null,
  source text not null,
  reference text,
  authors text,
  tags text[] not null default '{}',
  cover_url text,
  featured boolean not null default false,
  published_at timestamptz,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint published_requires_date check (status <> 'published' or published_at is not null)
);

create table public.regions (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  area_km2 numeric(14,2) not null default 0,
  center extensions.geography(point,4326) not null,
  boundary extensions.geometry(multipolygon,4326),
  zoom smallint not null default 7 check (zoom between 0 and 20),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index regions_boundary_gix on public.regions using gist(boundary);
create index regions_center_gix on public.regions using gist(center);

create table public.minerals (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  category public.mineral_category not null,
  description text not null default '',
  color text not null default '#b7d36b',
  active boolean not null default true
);

create table public.occurrences (
  id uuid primary key default extensions.gen_random_uuid(),
  region_id uuid references public.regions(id) on delete set null,
  mineral_id uuid references public.minerals(id) on delete restrict,
  name text not null,
  category text not null check (category in ('critico','estrategico','hub')),
  status text not null,
  description text not null default '',
  location extensions.geography(point,4326) not null,
  properties jsonb not null default '{}',
  source_id uuid,
  verified_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index occurrences_location_gix on public.occurrences using gist(location);
create index occurrences_region_idx on public.occurrences(region_id);
create index occurrences_mineral_idx on public.occurrences(mineral_id);

create table public.data_sources (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null,
  provider text not null,
  url text,
  license text,
  citation text,
  metadata jsonb not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.occurrences add constraint occurrences_source_fk foreign key (source_id) references public.data_sources(id) on delete set null;

create table public.imagery_periods (
  id uuid primary key default extensions.gen_random_uuid(),
  label text not null unique,
  starts_at date not null,
  ends_at date not null check (ends_at >= starts_at),
  quality smallint not null default 0 check (quality between 0 and 100),
  cloud_coverage numeric(5,2) not null default 0 check (cloud_coverage between 0 and 100),
  scene_count integer not null default 0,
  tile_url text,
  cog_url text,
  footprint extensions.geometry(multipolygon,4326),
  status public.layer_status not null default 'pending',
  source_id uuid references public.data_sources(id),
  metadata jsonb not null default '{}',
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index imagery_footprint_gix on public.imagery_periods using gist(footprint);
create index imagery_dates_idx on public.imagery_periods(starts_at, ends_at);

create table public.map_layers (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique,
  name text not null,
  kind text not null check (kind in ('raster','vector','geojson','pmtiles')),
  url_template text,
  attribution text,
  min_zoom smallint not null default 0,
  max_zoom smallint not null default 18,
  style jsonb not null default '{}',
  status public.layer_status not null default 'ready',
  public boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.processing_runs (
  id uuid primary key default extensions.gen_random_uuid(),
  kind text not null,
  status public.run_status not null default 'queued',
  external_job_id text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  error_message text,
  metadata jsonb not null default '{}',
  created_by uuid references public.profiles(id)
);

create table public.quality_metrics (
  id bigint generated always as identity primary key,
  imagery_period_id uuid not null references public.imagery_periods(id) on delete cascade,
  region_id uuid references public.regions(id) on delete cascade,
  metric text not null,
  value numeric not null,
  unit text,
  metadata jsonb not null default '{}',
  measured_at timestamptz not null default now(),
  unique(imagery_period_id, region_id, metric)
);

create table public.contact_messages (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'new' check (status in ('new','read','replied','archived')),
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  table_name text not null,
  record_id text,
  action text not null,
  actor_id uuid,
  old_data jsonb,
  new_data jsonb,
  occurred_at timestamptz not null default now()
);

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at = now(); return new; end; $$;
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger posts_updated before update on public.posts for each row execute function public.set_updated_at();
create trigger regions_updated before update on public.regions for each row execute function public.set_updated_at();
create trigger occurrences_updated before update on public.occurrences for each row execute function public.set_updated_at();
create trigger imagery_updated before update on public.imagery_periods for each row execute function public.set_updated_at();
create trigger layers_updated before update on public.map_layers for each row execute function public.set_updated_at();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$ begin insert into public.profiles(id,full_name) values(new.id,coalesce(new.raw_user_meta_data->>'full_name',new.email)); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.is_editor() returns boolean language sql stable security definer set search_path = '' as $$ select exists(select 1 from public.profiles where id = auth.uid() and role in ('admin','editor','reviewer')); $$;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$ select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin'); $$;

create or replace function public.audit_change() returns trigger language plpgsql security definer set search_path = '' as $$ begin insert into public.audit_logs(table_name,record_id,action,actor_id,old_data,new_data) values(TG_TABLE_NAME,coalesce(new.id::text,old.id::text),TG_OP,auth.uid(),case when TG_OP='INSERT' then null else to_jsonb(old) end,case when TG_OP='DELETE' then null else to_jsonb(new) end); return coalesce(new,old); end; $$;
create trigger posts_audit after insert or update or delete on public.posts for each row execute function public.audit_change();
create trigger regions_audit after insert or update or delete on public.regions for each row execute function public.audit_change();
create trigger occurrences_audit after insert or update or delete on public.occurrences for each row execute function public.audit_change();
create trigger imagery_audit after insert or update or delete on public.imagery_periods for each row execute function public.audit_change();

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.regions enable row level security;
alter table public.minerals enable row level security;
alter table public.occurrences enable row level security;
alter table public.data_sources enable row level security;
alter table public.imagery_periods enable row level security;
alter table public.map_layers enable row level security;
alter table public.processing_runs enable row level security;
alter table public.quality_metrics enable row level security;
alter table public.contact_messages enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles own read" on public.profiles for select using (id=auth.uid() or public.is_admin());
create policy "admin profiles write" on public.profiles for all using (public.is_admin()) with check (public.is_admin());
create policy "published posts read" on public.posts for select using (status='published' and published_at<=now() or public.is_editor());
create policy "editors insert posts" on public.posts for insert with check (public.is_editor());
create policy "editors update posts" on public.posts for update using (public.is_editor()) with check (public.is_editor());
create policy "admins delete posts" on public.posts for delete using (public.is_admin());
create policy "public regions read" on public.regions for select using (active or public.is_editor());
create policy "public minerals read" on public.minerals for select using (active or public.is_editor());
create policy "public occurrences read" on public.occurrences for select using (active or public.is_editor());
create policy "public imagery read" on public.imagery_periods for select using (status='ready' or public.is_editor());
create policy "public layers read" on public.map_layers for select using (public or public.is_editor());
create policy "editors spatial write" on public.regions for all using (public.is_editor()) with check (public.is_editor());
create policy "editors minerals write" on public.minerals for all using (public.is_editor()) with check (public.is_editor());
create policy "editors occurrences write" on public.occurrences for all using (public.is_editor()) with check (public.is_editor());
create policy "editors sources" on public.data_sources for all using (public.is_editor()) with check (public.is_editor());
create policy "editors imagery" on public.imagery_periods for all using (public.is_editor()) with check (public.is_editor());
create policy "editors layers" on public.map_layers for all using (public.is_editor()) with check (public.is_editor());
create policy "editors runs read" on public.processing_runs for select using (public.is_editor());
create policy "editors metrics read" on public.quality_metrics for select using (public.is_editor());
create policy "editors contact read" on public.contact_messages for select using (public.is_editor());
create policy "admin contact update" on public.contact_messages for update using (public.is_admin());
create policy "admin audit read" on public.audit_logs for select using (public.is_admin());

create or replace view public.posts_public with (security_invoker=true) as select id,slug,type,title,excerpt,body,source,reference,authors,tags,cover_url,featured,published_at from public.posts where status='published' and published_at<=now();
create or replace view public.regions_public with (security_invoker=true) as select id,slug,name,description,area_km2,extensions.st_x(center::extensions.geometry) center_lng,extensions.st_y(center::extensions.geometry) center_lat,zoom from public.regions where active;
create or replace view public.occurrences_public with (security_invoker=true) as select o.id,r.slug region_slug,o.name,o.category,coalesce(m.name,'Hub') mineral,o.status,o.description,extensions.st_x(o.location::extensions.geometry) longitude,extensions.st_y(o.location::extensions.geometry) latitude,o.properties from public.occurrences o left join public.regions r on r.id=o.region_id left join public.minerals m on m.id=o.mineral_id where o.active;
create or replace view public.imagery_periods_public with (security_invoker=true) as select id,label,starts_at,ends_at,quality,cloud_coverage,scene_count,tile_url,status,processed_at from public.imagery_periods where status='ready';

grant select on public.posts_public,public.regions_public,public.occurrences_public,public.imagery_periods_public to anon,authenticated;

insert into public.data_sources(name,provider,url,license,citation) values ('Landsat Collection 2','USGS / Google Earth Engine','https://developers.google.com/earth-engine/datasets/catalog/landsat','Public domain','USGS Landsat Collection 2') on conflict do nothing;
insert into public.regions(slug,name,description,area_km2,center,zoom) values
('all','Bahia','Área integrada de pesquisa do Prospecta 4.0.',4842,extensions.st_point(-41.8,-12.5)::extensions.geography,6),
('irece','Bacia de Irecê','Formação carbonática com potencial para fosfato sedimentar.',1240,extensions.st_point(-41.85,-11.30)::extensions.geography,8),
('chapada','Chapada Diamantina','Ocorrências de ETR associadas a carbonatitos e rochas alcalinas.',1580,extensions.st_point(-41.50,-12.50)::extensions.geography,8),
('caetite','Caetité','Formação Lagoa Real com mineralização uranífera.',680,extensions.st_point(-42.48,-14.07)::extensions.geography,9),
('brumado','Brumado','Depósito de magnesita metamórfica de classe mundial.',520,extensions.st_point(-41.66,-14.20)::extensions.geography,9),
('jacobina','Jacobina','Complexo máfico-ultramáfico com potencial para cromo.',440,extensions.st_point(-40.52,-11.18)::extensions.geography,9),
('serrinha','Serrinha','Granitoides e ortognaisses com anomalias de ETR.',382,extensions.st_point(-39.00,-11.66)::extensions.geography,9) on conflict(slug) do nothing;
insert into public.minerals(slug,name,category,description,color) values ('terras-raras','Terras-raras','critico','Elementos fundamentais para tecnologias avançadas.','#c7a46a'),('magnesita','Magnesita','critico','Matéria-prima refratária.','#c7a46a'),('uranio','Urânio','estrategico','Recurso energético estratégico.','#b7d36b'),('fosfato','Fosfato','estrategico','Fundamental para a segurança alimentar.','#b7d36b'),('cromo','Cromo','estrategico','Essencial para ligas de alto desempenho.','#b7d36b') on conflict(slug) do nothing;
insert into public.occurrences(region_id,mineral_id,name,category,status,description,location) select r.id,m.id,v.name,v.category,v.status,v.description,extensions.st_point(v.lng,v.lat)::extensions.geography from (values
('irece','fosfato','Bacia de Irecê','estrategico','Em estudo','Principal alvo de fosfato sedimentar.',-41.85,-11.30),
('chapada','terras-raras','Chapada Diamantina','critico','Identificado','ETR associadas a carbonatitos.',-41.50,-12.50),
('caetite','uranio','Caetité','estrategico','Mapeado','Mineralização uranífera regional.',-42.48,-14.07),
('brumado','magnesita','Brumado','critico','Mapeado','Depósito de magnesita metamórfica.',-41.66,-14.20),
('jacobina','cromo','Jacobina','estrategico','Identificado','Potencial para cromo e platinoides.',-40.52,-11.18),
('serrinha','terras-raras','Serrinha','critico','Em estudo','Anomalias de elementos terras-raras.',-39.00,-11.66)
) v(region_slug,mineral_slug,name,category,status,description,lng,lat) join public.regions r on r.slug=v.region_slug join public.minerals m on m.slug=v.mineral_slug where not exists(select 1 from public.occurrences o where o.name=v.name);
insert into public.occurrences(name,category,status,description,location) select 'LAPIG · UEFS','hub','Ativo','Base de pesquisa do Prospecta 4.0.',extensions.st_point(-38.96,-12.26)::extensions.geography where not exists(select 1 from public.occurrences where name='LAPIG · UEFS');

insert into public.imagery_periods(label,starts_at,ends_at,quality,cloud_coverage,scene_count,tile_url,status,source_id,processed_at)
select v.label,v.starts_at::date,v.ends_at::date,v.quality,greatest(2,35-round(v.quality/3.0)),greatest(6,round(v.quality/7.0)),'https://storage.googleapis.com/prospecta40-tiles/'||v.label||'/{z}/{x}/{y}.png','ready',s.id,now()
from (values ('2000-2008','2000-01-01','2008-12-31',84),('2009_1','2009-01-01','2009-06-30',57),('2009_2','2009-07-01','2009-12-31',79),('2010_1','2010-01-01','2010-06-30',52),('2010_2','2010-07-01','2010-12-31',76),('2011_1','2011-01-01','2011-06-30',61),('2011_2','2011-07-01','2011-12-31',83),('2012_2','2012-07-01','2012-12-31',74),('2013_1','2013-01-01','2013-06-30',49),('2013_2','2013-07-01','2013-12-31',80),('2014_1','2014-01-01','2014-06-30',55),('2014_2','2014-07-01','2014-12-31',77),('2015_1','2015-01-01','2015-06-30',63),('2015_2','2015-07-01','2015-12-31',85),('2016_1','2016-01-01','2016-06-30',48),('2016_2','2016-07-01','2016-12-31',78),('2017_1','2017-01-01','2017-06-30',60),('2017_2','2017-07-01','2017-12-31',82),('2018_1','2018-01-01','2018-06-30',64),('2018_2','2018-07-01','2018-12-31',87),('2019_1','2019-01-01','2019-06-30',59),('2019_2','2019-07-01','2019-12-31',84),('2020_1','2020-01-01','2020-06-30',62),('2020_2','2020-07-01','2020-12-31',81)) v(label,starts_at,ends_at,quality) cross join public.data_sources s where s.name='Landsat Collection 2' on conflict(label) do nothing;

insert into public.posts(slug,type,status,title,excerpt,body,source,tags,featured,published_at) values
('prospecta-antecipa-demanda','noticia','published','A pesquisa que antecipa o que o mundo vai precisar','IA e geotecnologias ajudam a mapear o potencial mineral da Bahia antes que a demanda chegue.','Enquanto governos negociam acesso a minerais críticos e estratégicos, o Prospecta 4.0 mapeia e modela o potencial mineral da Bahia com inteligência artificial e geotecnologias.','Prospecta 4.0',array['Prospecta 4.0','Bahia','IA & Geotecnologias'],true,'2026-04-20T12:00:00Z'),
('fosfogenese-proterozoica-2025','publicacao','published','Fosfogênese Proterozoica do Cráton do São Francisco','Conexões com eventos globais e implicações exploratórias para depósitos fosforíticos na Bahia.','A pesquisa revisa as condições paleoambientais das mineralizações de fosfato no Cráton do São Francisco.','XII SimeXmin · 2025',array['Fosfato','Cráton do São Francisco','Bahia'],false,'2025-11-15T12:00:00Z') on conflict(slug) do nothing;

commit;
