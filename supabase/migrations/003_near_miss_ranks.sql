-- 003_near_miss_ranks.sql
-- Store near-miss selections as a list of retrieved ranks for evaluation items.

alter table public.reviews
  add column if not exists near_miss_ranks jsonb;

comment on column public.reviews.near_miss_ranks is
  'JSON array of 1-based retrieved ranks marked as near-misses, e.g. [2,4,7]. Empty/null means none.';
