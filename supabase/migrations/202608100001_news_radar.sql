begin;

create type public.news_category as enum ('mercado','tecnologia','sustentabilidade','politica','exploracao');
create type public.news_status as enum ('pending','published','rejected','failed');

create table public.news_sources (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null unique,
  feed_url text not null unique,
  site_url text not null,
  language text not null default 'en',
  active boolean not null default true,
  last_polled_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.news_items (
  id uuid primary key default extensions.gen_random_uuid(),
  source_id uuid not null references public.news_sources(id) on delete restrict,
  source_url text not null unique,
  title_original text not null,
  snippet_original text not null default '',
  title_pt text not null,
  summary_pt text not null check (char_length(summary_pt) between 40 and 1200),
  category public.news_category not null,
  minerals text[] not null default '{}',
  keywords text[] not null default '{}',
  relevance smallint not null check (relevance between 0 and 100),
  image_url text,
  published_at timestamptz not null,
  ingested_at timestamptz not null default now(),
  status public.news_status not null default 'pending'
);
create index news_items_publication_idx on public.news_items(status,published_at desc);
create index news_items_keywords_gin on public.news_items using gin(keywords);
create index news_items_minerals_gin on public.news_items using gin(minerals);

alter table public.news_sources enable row level security;
alter table public.news_items enable row level security;
create policy "public published news read" on public.news_items for select using (status='published' or public.is_editor());
create policy "editors news sources" on public.news_sources for all using (public.is_editor()) with check (public.is_editor());
create policy "editors news items" on public.news_items for all using (public.is_editor()) with check (public.is_editor());

create or replace view public.news_items_public with (security_invoker=true) as
select n.id,n.title_pt,n.summary_pt,s.name source_name,n.source_url,n.image_url,n.published_at,n.category,n.minerals,n.keywords,n.relevance
from public.news_items n join public.news_sources s on s.id=n.source_id
where n.status='published';
grant select on public.news_items_public to anon,authenticated;

insert into public.news_sources(name,feed_url,site_url) values
('MINING.com · Minerais críticos','https://www.mining.com/commodity/rare-earth/feed/','https://www.mining.com/'),
('International Mining','https://im-mining.com/feed/','https://im-mining.com/'),
('Mining Technology','https://www.mining-technology.com/feed/','https://www.mining-technology.com/')
on conflict(name) do nothing;

commit;
