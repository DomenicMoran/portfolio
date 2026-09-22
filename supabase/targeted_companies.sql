-- Personalised portfolio landing pages. Run in Supabase SQL Editor.
create table if not exists public.targeted_companies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug = lower(slug) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  company_name text not null,
  founder_name text not null,
  tech_stack text[] not null default '{}',
  pain_point_summary text not null,
  matched_projects jsonb not null default '[]'::jsonb,
  logo_url text,
  company_url text,
  created_at timestamptz not null default now()
);

alter table public.targeted_companies enable row level security;
grant select on table public.targeted_companies to anon, authenticated;

-- Only public, intentionally prepared landing-page data is readable by visitors.
drop policy if exists "Public can read targeted landing pages" on public.targeted_companies;
create policy "Public can read targeted landing pages"
  on public.targeted_companies for select to anon, authenticated using (true);

-- No browser write policy. The pitch CLI uses SUPABASE_SERVICE_ROLE_KEY.
create index if not exists targeted_companies_slug_idx on public.targeted_companies (slug);
