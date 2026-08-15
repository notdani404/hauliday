-- M10 · User profile (D-023). Optional demographic + display info, owner-only.
--
-- Everything is nullable — profile is never required to use the app. Age is a
-- birth YEAR (enough to bucket demographics, far less sensitive than a full DOB
-- alongside name + email). No phone (email suffices); avatar is the Google
-- picture URL, not an uploaded file. RLS locks every row to its owner; profiles
-- are never shared.

create table public.profile (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  first_name   text,
  last_name    text,
  birth_year   integer check (birth_year between 1900 and 2200),
  gender       text,   -- app-guided: female | male | non_binary | prefer_not_to_say | <self-described>
  country      text,   -- ISO alpha-2 or free-text home market
  avatar_url   text,   -- cached from the Google identity; not user-uploaded
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger set_updated_at before update on public.profile
  for each row execute function extensions.moddatetime (updated_at);

alter table public.profile enable row level security;

-- Owner-only: a user can see and edit only their own profile.
create policy "profile select own"
  on public.profile for select to authenticated
  using (user_id = (select auth.uid()));
create policy "profile insert own"
  on public.profile for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "profile update own"
  on public.profile for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
