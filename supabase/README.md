# Supabase Setup

Run `migrations/20260623000000_storage_buckets_and_policies.sql` in the Supabase SQL Editor after creating the core database tables.

Expected storage paths:

- `thesis-documents/{project_id}/{user_id}/{filename}`
- `profile-pictures/{user_id}/{filename}`
- `temp-uploads/{user_id}/{filename}`

The document policies depend on these tables:

- `public.thesis_projects`
- `public.groups`
- `public.group_members`

