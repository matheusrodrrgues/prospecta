begin;

create table public.data_submissions (
  id uuid primary key default extensions.gen_random_uuid(),
  protocol text not null unique,
  title text not null check (char_length(title) between 3 and 160),
  contributor_name text not null check (char_length(contributor_name) between 2 and 120),
  contributor_email text not null,
  organization text,
  dataset_type text not null check (dataset_type in ('inline','cog','remote_cog','earth_engine')),
  period_label text,
  satellite text,
  methodology text not null check (char_length(methodology) between 20 and 5000),
  license text not null default 'CC-BY-4.0',
  review_url text,
  external_url text,
  blob_url text,
  blob_pathname text,
  original_filename text,
  content_type text,
  file_size bigint check (file_size is null or file_size >= 0),
  geojson jsonb,
  tile_url text,
  status text not null default 'received' check (status in ('received','uploading','validating','community','verified','official','rejected')),
  validation jsonb not null default '{}',
  ip_hash text,
  user_agent text,
  terms_accepted boolean not null default false,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index data_submissions_status_idx on public.data_submissions(status, created_at desc);
create index data_submissions_protocol_idx on public.data_submissions(protocol);
create index data_submissions_ip_idx on public.data_submissions(ip_hash, created_at desc);

create trigger data_submissions_updated before update on public.data_submissions for each row execute function public.set_updated_at();
create trigger data_submissions_audit after insert or update or delete on public.data_submissions for each row execute function public.audit_change();

alter table public.data_submissions enable row level security;
create policy "public community contributions read" on public.data_submissions for select using (status in ('community','verified','official'));
create policy "editors manage contributions" on public.data_submissions for all using (public.is_editor()) with check (public.is_editor());

create or replace view public.community_layers_public with (security_invoker=true) as
select id,protocol,title,contributor_name,organization,dataset_type,period_label,satellite,methodology,license,
       review_url,external_url,geojson,tile_url,status,validation,created_at
from public.data_submissions
where status in ('community','verified','official');

grant select on public.community_layers_public to anon,authenticated;
grant select,insert,update,delete on public.data_submissions to service_role;

commit;
