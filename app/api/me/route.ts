import { fail, getCaller } from "@/lib/auth";
import { getConfig } from "@/lib/data";
import { meetsHolding } from "@/lib/solana";
import { adminClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const caller = await getCaller(req);
  if (!caller) return fail(401, "Connect your wallet first.");
  const [config, { data: setup }] = await Promise.all([
    getConfig(),
    adminClient().from("setups").select("*").eq("user_id", caller.user.id).maybeSingle(),
  ]);
  let holding: { ok: boolean; need: number; have?: number } | null = null;
  try { holding = await meetsHolding(caller.wallet, config.mint); } catch { holding = null; }
  return Response.json({ wallet: caller.wallet, isAdmin: caller.isAdmin, setup, holding });
}
