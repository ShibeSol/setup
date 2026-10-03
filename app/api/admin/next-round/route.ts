import { fail } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin";
import { getConfig } from "@/lib/data";
import { adminClient } from "@/lib/supabase-server";

/** Ends the current round. Ratings for the old round are kept; the leaderboard starts from zero. */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;
  const b = await req.json().catch(() => ({}));
  const config = await getConfig();
  if (Number(b?.fromRound) !== config.current_round) return fail(409, "The round already changed. Reload the page.");
  const { error } = await adminClient().from("config").update({ current_round: config.current_round + 1, pool_sol: 0, ends_at: null }).eq("id", 1);
  if (error) return fail(500, "Couldn't start the next round.");
  return Response.json({ ok: true, round: config.current_round + 1 });
}
