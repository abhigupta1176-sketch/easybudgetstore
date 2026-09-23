-- Run this once in Supabase Dashboard -> SQL Editor -> New query.
-- It makes storefront content readable to visitors but writable only by the
-- verified owner account. No secret key is used by the website.
create table if not exists public.site_store (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.site_store enable row level security;

drop policy if exists "public can read published site data" on public.site_store;
create policy "public can read published site data"
on public.site_store for select
to anon, authenticated
using (true);

drop policy if exists "owner can insert site data" on public.site_store;
create policy "owner can insert site data"
on public.site_store for insert
to authenticated
with check ((auth.jwt() ->> 'email') = 'abhigupta1176@gmail.com');

drop policy if exists "owner can update site data" on public.site_store;
create policy "owner can update site data"
on public.site_store for update
to authenticated
using ((auth.jwt() ->> 'email') = 'abhigupta1176@gmail.com')
with check ((auth.jwt() ->> 'email') = 'abhigupta1176@gmail.com');
