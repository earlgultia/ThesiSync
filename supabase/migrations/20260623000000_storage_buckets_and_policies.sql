-- Supabase Storage setup for Dissertation Hub / ThesiSync.
-- Run this after the core tables exist:
-- group_members, groups, thesis_projects.

insert into storage.buckets (id, name, public)
values ('thesis-documents', 'thesis-documents', false)
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public;

insert into storage.buckets (id, name, public)
values ('profile-pictures', 'profile-pictures', true)
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public;

insert into storage.buckets (id, name, public)
values ('temp-uploads', 'temp-uploads', false)
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public;

drop policy if exists "Users can view their project documents" on storage.objects;
drop policy if exists "Users can upload project documents" on storage.objects;
drop policy if exists "Users can update their documents" on storage.objects;
drop policy if exists "Public can view profile pictures" on storage.objects;
drop policy if exists "Users can upload their profile picture" on storage.objects;
drop policy if exists "Users can manage their temp uploads" on storage.objects;

create policy "Users can view their project documents"
on storage.objects
for select
using (
  bucket_id = 'thesis-documents'
  and exists (
    select 1
    from public.group_members gm
    join public.groups g on gm.group_id = g.id
    join public.thesis_projects p on g.project_id = p.id
    where p.id = (storage.foldername(name))[1]::uuid
      and gm.user_id = auth.uid()
  )
);

create policy "Users can upload project documents"
on storage.objects
for insert
with check (
  bucket_id = 'thesis-documents'
  and exists (
    select 1
    from public.group_members gm
    join public.groups g on gm.group_id = g.id
    join public.thesis_projects p on g.project_id = p.id
    where p.id = (storage.foldername(name))[1]::uuid
      and gm.user_id = auth.uid()
  )
);

create policy "Users can update their documents"
on storage.objects
for update
using (
  bucket_id = 'thesis-documents'
  and auth.uid()::text = (storage.foldername(name))[2]
)
with check (
  bucket_id = 'thesis-documents'
  and auth.uid()::text = (storage.foldername(name))[2]
);

create policy "Public can view profile pictures"
on storage.objects
for select
using (bucket_id = 'profile-pictures');

create policy "Users can upload their profile picture"
on storage.objects
for insert
with check (
  bucket_id = 'profile-pictures'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can manage their temp uploads"
on storage.objects
for all
using (
  bucket_id = 'temp-uploads'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'temp-uploads'
  and auth.uid()::text = (storage.foldername(name))[1]
);
