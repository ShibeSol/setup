import { fail } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin";
import { TX_SIGNATURE } from "@/lib/format";
import { getConfig } from "@/lib/data";
import { adminClient } from "@/lib/supabase-server";

/** Records a payout the admin already sent from their own wallet. */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;
  const b = await req.json().catch(() => null);
  const tx = String(b?.tx ?? "").trim();
  const place = parseInt(b?.place, 10);
  const amount = Number(b?.amount_sol);
  if (!TX_SIGNATURE.test(tx)) return fail(400, "Paste the transaction signature from your wallet or Solscan.");
  if (!(place >= 1) || !(amount > 0)) return fail(400, "Enter the place and the SOL amount you sent.");

  const db = adminClient();
  const config = await getConfig();
  const { data: setup } = await db.from("setups").select("id, title, wallet").eq("id", String(b?.setupId ?? "")).maybeSingle();
  if (!setup) return fail(404, "That setup no longer exists.");
  const { error } = await db.from("payouts").upsert(
    { round: config.current_round, place, setup_id: setup.id, title: setup.title, wallet: setup.wallet, amount_sol: amount, tx, paid_at: new Date().toISOString() },
    { onConflict: "round,place" },
  );
  if (error) return fail(500, error.code === "23505" ? "That transaction is already recorded." : "Couldn't record the payout.");
  return Response.json({ ok: true });
}
