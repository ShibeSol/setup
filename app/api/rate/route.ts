import { fail, getCaller } from "@/lib/auth";
import { getConfig } from "@/lib/data";
import { meetsHolding } from "@/lib/solana";
import { adminClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const MAX_RATINGS_PER_HOUR = 200;

export async function POST(req: Request) {
  const caller = await getCaller(req);
  if (!caller) return fail(401, "Connect your wallet to rate.");
  const body = await req.json().catch(() => null);
  const setupId = typeof body?.setupId === "string" ? body.setupId : "";
  const score = Number(body?.score);
  if (!setupId || !Number.isInteger(score) || score < 1 || score > 10) return fail(400, "Pick a score from 1 to 10.");

  const config = await getConfig();
  if (config.ends_at && new Date(config.ends_at).getTime() < Date.now()) return fail(409, "This round has ended. Rating opens again when the next round starts.");

  const db = adminClient();
  const { data: setup } = await db.from("setups").select("id, user_id, wallet, hidden").eq("id", setupId).maybeSingle();
  if (!setup || setup.hidden) return fail(404, "That setup isn't available any more.");
  if (setup.user_id === caller.user.id || setup.wallet === caller.wallet) return fail(403, "You can't rate your own setup.");

  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await db.from("ratings").select("*", { count: "exact", head: true }).eq("rater_id", caller.user.id).gte("created_at", since);
  if ((count ?? 0) >= MAX_RATINGS_PER_HOUR) return fail(429, "You've rated a lot in the last hour. Take a break and come back soon.");

  try {
    const hold = await meetsHolding(caller.wallet, config.mint);
    if (!hold.ok) return fail(403, `Rating needs at least ${hold.need.toLocaleString("en-US")} tokens in your wallet. You have ${(hold.have ?? 0).toLocaleString("en-US")}.`);
  } catch {
    return fail(503, "Couldn't check your token balance right now. Try again in a moment.");
  }

  const { error } = await db.from("ratings").upsert(
    { round: config.current_round, setup_id: setupId, rater_id: caller.user.id, rater_wallet: caller.wallet, score, created_at: new Date().toISOString() },
    { onConflict: "round,setup_id,rater_id" },
  );
  if (error) return fail(500, "Your rating didn't save. Try again.");

  const { data: st } = await db.from("standings").select("n, avg").eq("id", setupId).maybeSingle();
  return Response.json({ ok: true, n: st?.n ?? 1, avg: st?.avg ?? score });
}
