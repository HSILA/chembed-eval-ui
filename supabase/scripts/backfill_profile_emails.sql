-- Backfill email into public.profiles for existing auth users.

insert into public.profiles (user_id, email)
select u.id, u.email
from auth.users u
on conflict (user_id) do update
set email = excluded.email;
