import { getCaller } from "@/lib/auth";
import { getConfig } from "@/lib/data";
import { adminClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

/** Setups for the Rate screen: everything visible, minus your own and the ones you've rated this round. */
export async function GET(req: Request) {
  const caller = await getCaller(req);
  const config = await getConfig();
  const db = adminClient();
  const { data: rows } = await db.from("standings").select("*").order("created_at", { ascending: false }).limit(300);
  let list = rows ?? [];
  let rated = 0;
  if (caller) {
    const { data: mine } = await db.from("ratings").select("setup_id").eq("round", config.current_round).eq("rater_id", caller.user.id);
    const done = new Set((mine ?? []).map(r => r.setup_id));
    rated = done.size;
    list = list.filter(s => s.wallet !== caller.wallet && !done.has(s.id));
  }
  // Show setups with few ratings first so new posts get seen, shuffled within that.
  list = list.map(s => ({ s, k: s.n + Math.random() * 3 })).sort((a, b) => a.k - b.k).map(x => x.s).slice(0, 40);
  return Response.json({ round: config.current_round, endsAt: config.ends_at, rated, total: (rows ?? []).length, setups: list });
}
