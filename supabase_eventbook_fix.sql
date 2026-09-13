-- EVENTBOOK SUPABASE FIX
-- Run this entire script in Supabase SQL Editor.
-- It aligns Auth, profiles, events, registrations and Storage with the React app.

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1. Registration contact fields used by the EventBook form
-- ------------------------------------------------------------

alter table public.registrations
  add column if not exists full_name text,
  add column if not exists phone text,
  add column if not exists email text;

-- ------------------------------------------------------------
-- 2. Helper: safely determine whether the current user is admin
-- ------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ------------------------------------------------------------
-- 3. Automatically create a profile when a user registers
--    This avoids the frontend trying to insert into profiles
--    while email confirmation/session state may still be pending.
-- ------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'phone',
    'user'
  )
  on conflict (id) do update
    set full_name = excluded.full_name,
        phone = excluded.phone;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

-- Backfill profiles for Auth users created before this trigger existed.
insert into public.profiles (id, full_name, phone, role)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', ''),
  u.raw_user_meta_data ->> 'phone',
  'user'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- ------------------------------------------------------------
-- 4. Profiles RLS
-- ------------------------------------------------------------

alter table public.profiles enable row level security;

drop policy if exists "Users can create own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;

create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "Admins can view all profiles"
on public.profiles
for select
to authenticated
using (public.is_admin());

-- Do not give ordinary users INSERT access to profiles.
-- The Auth trigger above creates profiles safely.
-- Do not give ordinary users UPDATE access to role.

-- ------------------------------------------------------------
-- 5. Events RLS
-- ------------------------------------------------------------

alter table public.events enable row level security;

drop policy if exists "Public can view events" on public.events;
drop policy if exists "Admins can create events" on public.events;
drop policy if exists "Admins can delete events" on public.events;
drop policy if exists "Admins can update events" on public.events;

create policy "Public can view events"
on public.events
for select
to anon, authenticated
using (true);

create policy "Admins can create events"
on public.events
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update events"
on public.events
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete events"
on public.events
for delete
to authenticated
using (public.is_admin());

-- ------------------------------------------------------------
-- 6. Registrations RLS
-- ------------------------------------------------------------

alter table public.registrations enable row level security;

drop policy if exists "Users can create own registrations" on public.registrations;
drop policy if exists "Users can view own registrations" on public.registrations;
drop policy if exists "Admins can view all registrations" on public.registrations;
drop policy if exists "Admins can delete registrations" on public.registrations;
drop policy if exists "Admins can update registrations" on public.registrations;

create policy "Users can create own registrations"
on public.registrations
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can view own registrations"
on public.registrations
for select
to authenticated
using (auth.uid() = user_id);

create policy "Admins can view all registrations"
on public.registrations
for select
to authenticated
using (public.is_admin());

create policy "Admins can update registrations"
on public.registrations
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete registrations"
on public.registrations
for delete
to authenticated
using (public.is_admin());

-- ------------------------------------------------------------
-- 7. Storage RLS
-- ------------------------------------------------------------

-- Event flyers: public read, admin-managed.
insert into storage.buckets (id, name, public)
values ('event-flyers', 'event-flyers', true)
on conflict (id) do update set public = true;

-- Proofs: private. Admin uses signed URLs to view them.
insert into storage.buckets (id, name, public)
values ('proof-of-payment', 'proof-of-payment', false)
on conflict (id) do update set public = false;

update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png']
where id = 'proof-of-payment';

update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'event-flyers';

-- Remove older policies with these names if they exist.
drop policy if exists "Public can view event flyers" on storage.objects;
drop policy if exists "Admins can upload event flyers" on storage.objects;
drop policy if exists "Admins can update event flyers" on storage.objects;
drop policy if exists "Admins can delete event flyers" on storage.objects;
drop policy if exists "Users can upload payment proofs" on storage.objects;
drop policy if exists "Admins can view payment proofs" on storage.objects;
drop policy if exists "Admins can delete payment proofs" on storage.objects;

create policy "Public can view event flyers"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'event-flyers');

create policy "Admins can upload event flyers"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'event-flyers'
  and public.is_admin()
);

create policy "Admins can update event flyers"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'event-flyers'
  and public.is_admin()
)
with check (
  bucket_id = 'event-flyers'
  and public.is_admin()
);

create policy "Admins can delete event flyers"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'event-flyers'
  and public.is_admin()
);

create policy "Users can upload payment proofs"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'proof-of-payment'
  and (storage.foldername(name))[1] = (auth.uid())::text
);

create policy "Admins can view payment proofs"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'proof-of-payment'
  and public.is_admin()
);

create policy "Users can delete own payment proofs"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'proof-of-payment'
  and (storage.foldername(name))[1] = (auth.uid())::text
);

create policy "Admins can delete payment proofs"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'proof-of-payment'
  and public.is_admin()
);

-- ------------------------------------------------------------
-- 8. Optional: verify your existing admin profile after running
-- ------------------------------------------------------------
-- Replace the email below with your actual admin email and run:
--
-- select u.id, u.email, p.full_name, p.role
-- from auth.users u
-- left join public.profiles p on p.id = u.id
-- where u.email = 'YOUR-ADMIN-EMAIL';
--
-- If the profile exists but role is user, run:
-- update public.profiles set role = 'admin' where id = 'ADMIN-USER-UUID';
