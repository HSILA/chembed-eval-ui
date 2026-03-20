-- Patch current DB to align evaluation_reviews with the updated app schema.

alter table public.evaluation_reviews
  add column if not exists scientific_validity int;

alter table public.evaluation_reviews
  drop column if exists top10_relevance;
