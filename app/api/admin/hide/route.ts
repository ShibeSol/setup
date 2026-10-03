import { fail } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin";
import { adminClient } from "@/lib/supabase-server";

/** Hide (or restore) a setup that breaks the rules: not a setup, stolen photo, NSFW. */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;
  const b = await req.json().catch(() => null);
  const { error } = await adminClient().from("setups").update({ hidden: Boolean(b?.hidden) }).eq("id", String(b?.setupId ?? ""));
  if (error) return fail(500, "Couldn't update that setup.");
  return Response.json({ ok: true });
}

/** Hidden setups, so they can be restored. */
export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;
  const { data } = await adminClient().from("setups").select("id, title, wallet, image_path").eq("hidden", true).order("updated_at", { ascending: false });
  return Response.json({ setups: data ?? [] });
}
