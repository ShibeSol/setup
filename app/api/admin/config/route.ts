import { fail } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin";
import { SOL_ADDRESS } from "@/lib/format";
import { adminClient } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;
  const b = await req.json().catch(() => null);
  if (!b) return fail(400, "Bad request.");
  const split = Array.isArray(b.split) ? b.split.map(Number) : [];
  if (!split.length || split.some((n: number) => !(n > 0)) || split.reduce((a: number, n: number) => a + n, 0) > 100) {
    return fail(400, "Split must be positive percentages that add up to 100 or less.");
  }
  const mint = String(b.mint ?? "").trim();
  if (mint && !SOL_ADDRESS.test(mint)) return fail(400, "That contract address doesn't look like a Solana address.");
  const update = {
    pool_sol: Math.max(0, Number(b.pool_sol) || 0),
    ends_at: b.ends_at ? new Date(b.ends_at).toISOString() : null,
    min_ratings: Math.max(0, parseInt(b.min_ratings, 10) || 0),
    split,
    mint,
  };
  const { error } = await adminClient().from("config").update(update).eq("id", 1);
  if (error) return fail(500, "Couldn't save the settings.");
  return Response.json({ ok: true });
}
