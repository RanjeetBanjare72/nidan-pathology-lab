-- NIDAN Pathology Lab production RLS fixes
-- Run this in the Supabase SQL editor as the project owner.

begin;

create or replace function public.current_user_lab_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select lm.lab_id
  from public.lab_members lm
  where lm.user_id = auth.uid()
    and coalesce(lm.active, true) = true
$$;

revoke all on function public.current_user_lab_ids() from public;
grant execute on function public.current_user_lab_ids() to authenticated;

alter table public.lab_members enable row level security;

drop policy if exists "lab_members_select_same_lab" on public.lab_members;
drop policy if exists "lab_members_insert_same_lab" on public.lab_members;
drop policy if exists "lab_members_update_same_lab" on public.lab_members;
drop policy if exists "lab_members_delete_same_lab" on public.lab_members;
drop policy if exists "Users can read their own lab membership" on public.lab_members;
drop policy if exists "Users can manage lab members" on public.lab_members;

create policy "lab_members_select_non_recursive"
on public.lab_members
for select
to authenticated
using (
  user_id = auth.uid()
  or lab_id in (select public.current_user_lab_ids())
);

create policy "lab_members_insert_non_recursive"
on public.lab_members
for insert
to authenticated
with check (lab_id in (select public.current_user_lab_ids()));

create policy "lab_members_update_non_recursive"
on public.lab_members
for update
to authenticated
using (lab_id in (select public.current_user_lab_ids()))
with check (lab_id in (select public.current_user_lab_ids()));

create policy "lab_members_delete_non_recursive"
on public.lab_members
for delete
to authenticated
using (lab_id in (select public.current_user_lab_ids()));

-- Doctors must be written to Supabase by authenticated lab users.
alter table public.doctors enable row level security;

drop policy if exists "doctors_select_lab_members" on public.doctors;
drop policy if exists "doctors_insert_lab_members" on public.doctors;
drop policy if exists "doctors_update_lab_members" on public.doctors;
drop policy if exists "doctors_delete_lab_members" on public.doctors;

create policy "doctors_select_lab_members"
on public.doctors
for select
to authenticated
using (
  lab_id is null
  or lab_id in (select public.current_user_lab_ids())
);

create policy "doctors_insert_lab_members"
on public.doctors
for insert
to authenticated
with check (
  lab_id is null
  or lab_id in (select public.current_user_lab_ids())
);

create policy "doctors_update_lab_members"
on public.doctors
for update
to authenticated
using (
  lab_id is null
  or lab_id in (select public.current_user_lab_ids())
)
with check (
  lab_id is null
  or lab_id in (select public.current_user_lab_ids())
);

create policy "doctors_delete_lab_members"
on public.doctors
for delete
to authenticated
using (
  lab_id is null
  or lab_id in (select public.current_user_lab_ids())
);

commit;
