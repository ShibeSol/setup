-- Run the leaderboard view as the caller, not the owner (fixes Supabase's security_definer_view lint).
-- Readers may see scores per setup, but never who gave them: only these three columns are granted.
alter view public.standings set (security_invoker = true);
revoke all on public.ratings from anon, authenticated;
grant select (round, setup_id, score) on public.ratings to anon, authenticated;
create policy "anyone can read scores" on public.ratings for select using (true);
