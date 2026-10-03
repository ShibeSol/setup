import { fail, getCaller } from "@/lib/auth";
import { adminClient } from "@/lib/supabase-server";
import { TAGS } from "@/lib/types";

export const dynamic = "force-dynamic";

const MAX_BYTES = 4 * 1024 * 1024;

function sniff(buf: Uint8Array): "jpg" | "png" | "webp" | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "png";
  if (String.fromCharCode(...buf.slice(0, 4)) === "RIFF" && String.fromCharCode(...buf.slice(8, 12)) === "WEBP") return "webp";
  return null;
}

const text = (form: FormData, key: string, max: number) => String(form.get(key) ?? "").trim().slice(0, max);

/** Create or update the caller's one setup. */
export async function POST(req: Request) {
  const caller = await getCaller(req);
  if (!caller) return fail(401, "Connect your wallet to post.");
  const form = await req.formData().catch(() => null);
  if (!form) return fail(400, "Something went wrong sending the form. Try again.");

  const title = text(form, "title", 60);
  if (!title) return fail(400, "Give your setup a name.");
  let tags: string[] = [];
  try { tags = (JSON.parse(String(form.get("tags") ?? "[]")) as string[]).filter(t => TAGS.includes(t)); } catch {}

  const db = adminClient();
  const { data: existing } = await db.from("setups").select("id, image_path").eq("user_id", caller.user.id).maybeSingle();

  let imagePath = existing?.image_path as string | undefined;
  const file = form.get("image");
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_BYTES) return fail(413, "That photo is too large. Use one under 4 MB.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const ext = sniff(bytes);
    if (!ext) return fail(415, "Use a JPG, PNG or WebP photo.");
    const path = `${caller.user.id}/${Date.now()}.${ext}`;
    const { error } = await db.storage.from("setup-images").upload(path, bytes, { contentType: `image/${ext === "jpg" ? "jpeg" : ext}`, upsert: false });
    if (error) return fail(500, "The photo didn't upload. Try again.");
    if (existing?.image_path) await db.storage.from("setup-images").remove([existing.image_path]);
    imagePath = path;
  }
  if (!imagePath) return fail(400, "Add a photo of your setup.");

  const row = {
    user_id: caller.user.id,
    wallet: caller.wallet,
    title,
    handle: text(form, "handle", 30).replace(/^@/, ""),
    cpu: text(form, "cpu", 60),
    gpu: text(form, "gpu", 60),
    monitor: text(form, "monitor", 80),
    peripherals: text(form, "peripherals", 100),
    tags,
    image_path: imagePath,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await db.from("setups").upsert(row, { onConflict: "user_id" }).select("*").single();
  if (error) return fail(500, "Your setup didn't save. Try again.");
  return Response.json({ setup: data });
}

/** Remove the caller's setup and its photo. */
export async function DELETE(req: Request) {
  const caller = await getCaller(req);
  if (!caller) return fail(401, "Connect your wallet first.");
  const db = adminClient();
  const { data: existing } = await db.from("setups").select("id, image_path").eq("user_id", caller.user.id).maybeSingle();
  if (!existing) return Response.json({ ok: true });
  await db.from("setups").delete().eq("id", existing.id);
  await db.storage.from("setup-images").remove([existing.image_path]);
  return Response.json({ ok: true });
}
