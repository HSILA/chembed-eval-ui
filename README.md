# chembed-eval-ui

Expert review UI for ChEmbed datasets.

## Quickstart

```bash
cp .env.example .env.local
# fill env vars
npm install

# local one-time ingestion (uses SUPABASE_SERVICE_ROLE_KEY)
npm run ingest

npm run dev
```

## Reviewer flow

1. Open `/login` and sign in with Supabase email/password.
2. Go to `/review`.
3. Pick a bucket from the sidebar:
   - Training: `chemrxiv`, `dolma`
   - Evaluation: `Successful`, `Unsuccessful`
4. Review one item at a time with Previous/Next.
5. Changes autosave to `reviews` for your user.
6. Use **Export current bucket CSV** to download your labels for that bucket.

### Permissions

- `/review` redirects to `/login` when not authenticated.
- Users with `profiles.can_review=false` can browse items but cannot edit.
- Read-only banner is shown: `Read-only: not authorized to submit reviews`.

## Notes

- Frontend-only: app talks directly to Supabase via `@supabase/supabase-js`.
- Uses Supabase Auth email/password + RLS policies on tables.
