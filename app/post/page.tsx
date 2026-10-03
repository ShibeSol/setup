"use client";
import { useEffect, useState } from "react";
import { useWallet } from "@/components/Wallet";
import { compressPhoto } from "@/lib/compress";
import { imageUrl } from "@/lib/format";
import { TAGS } from "@/lib/types";

type Mine = { title: string; handle: string; cpu: string; gpu: string; monitor: string; peripherals: string; tags: string[]; image_path: string; hidden: boolean };

export default function PostPage() {
  const { wallet, ready, connect, authFetch } = useWallet();
  const [mine, setMine] = useState<Mine | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!wallet) { setMine(null); setLoaded(true); return; }
    authFetch("/api/me").then(r => r.json()).then(b => { setMine(b.setup ?? null); setLoaded(true); }).catch(() => setLoaded(true));
  }, [wallet, authFetch]);

  async function pick(file: File | undefined) {
    if (!file) return;
    setMsg(null);
    try {
      const blob = await compressPhoto(file);
      setPhoto(blob);
      setPreview(URL.createObjectURL(blob));
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (!String(form.get("title") ?? "").trim()) { setMsg({ ok: false, text: "Give your setup a name." }); return; }
    if (!photo && !mine) { setMsg({ ok: false, text: "Add a photo of your setup." }); return; }
    const tags = TAGS.filter((_, i) => form.get(`tag-${i}`));
    TAGS.forEach((_, i) => form.delete(`tag-${i}`));
    form.set("tags", JSON.stringify(tags));
    if (photo) form.set("image", photo, "setup.jpg");
    setBusy(true); setMsg({ ok: true, text: "Posting…" });
    const res = await authFetch("/api/setup", { method: "POST", body: form });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setMsg({ ok: false, text: body.error ?? "Your setup didn't save." }); return; }
    setMine(body.setup); setPhoto(null);
    setMsg({ ok: true, text: "Posted. Your setup is in everyone's rating queue now." });
  }

  async function remove() {
    if (!confirmRemove) { setConfirmRemove(true); return; }
    const res = await authFetch("/api/setup", { method: "DELETE" });
    if (res.ok) { setMine(null); setPreview(null); setConfirmRemove(false); setMsg({ ok: true, text: "Your setup was removed." }); }
  }
  const [confirmRemove, setConfirmRemove] = useState(false);

  if (!ready || !loaded) return <div className="empty"><p>Loading…</p></div>;
  if (!wallet) {
    return (
      <section>
        <h2>Post your setup</h2>
        <div className="empty">
          <h2>Connect your wallet to post</h2>
          <p>Your wallet is your account here, and it&apos;s where your SOL goes if your setup wins a round. Signing in is free and moves no funds.</p>
          <div className="row" style={{ justifyContent: "center", marginTop: 14 }}><button className="btn primary" type="button" onClick={connect}>Connect wallet</button></div>
        </div>
      </section>
    );
  }

  const shown = preview ?? (mine ? imageUrl(mine.image_path) : null);
  const d = mine ?? { title: "", handle: "", cpu: "", gpu: "", monitor: "", peripherals: "", tags: [] as string[] };

  return (
    <section>
      <h2>{mine ? "Update your setup" : "Post your setup"}</h2>
      <p className="sub">One setup per wallet. Updating keeps the ratings you already have this round.</p>
      {mine?.hidden && <p className="notice warn">Your setup was hidden by the dev for breaking the rules, so it isn&apos;t shown or ranked.</p>}
      <form className="post" onSubmit={submit}>
        <div>
          <label className={`drop${shown ? " has" : ""}${over ? " over" : ""}`} htmlFor="photo"
            onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
            onDrop={e => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files[0]); }}>
            {shown ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shown} alt="Your setup photo" />
            ) : (
              <><strong>Add a photo of your setup</strong><span>Drop it here or tap to choose. Landscape, lights on.</span></>
            )}
          </label>
          <input id="photo" type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e => pick(e.target.files?.[0])} />
          {shown && <p className="legend" style={{ marginTop: 8 }}>Tap the photo to replace it.</p>}
        </div>
        <div className="fields">
          <label className="f" htmlFor="title">Setup name<input id="title" name="title" defaultValue={d.title} placeholder="e.g. The Midnight Ultrawide" maxLength={60} required /></label>
          <label className="f" htmlFor="handle">Your handle<input id="handle" name="handle" defaultValue={d.handle} placeholder="@yourname" maxLength={30} /></label>
          <div className="two">
            <label className="f" htmlFor="cpu">CPU<input id="cpu" name="cpu" defaultValue={d.cpu} placeholder="Ryzen 7 7800X3D" maxLength={60} /></label>
            <label className="f" htmlFor="gpu">GPU<input id="gpu" name="gpu" defaultValue={d.gpu} placeholder="RTX 4070 Super" maxLength={60} /></label>
          </div>
          <label className="f" htmlFor="monitor">Monitor<input id="monitor" name="monitor" defaultValue={d.monitor} placeholder='27" 1440p 165Hz' maxLength={80} /></label>
          <label className="f" htmlFor="peripherals">Keyboard, mouse, extras<input id="peripherals" name="peripherals" defaultValue={d.peripherals} placeholder="Keychron Q1, G Pro X Superlight" maxLength={100} /></label>
          <fieldset>
            <legend>Vibe</legend>
            <div className="tagpick">
              {TAGS.map((t, i) => (
                <label key={t}><input type="checkbox" name={`tag-${i}`} defaultChecked={d.tags.includes(t)} /><span>{t}</span></label>
              ))}
            </div>
          </fieldset>
          <div>
            <span className="kicker">Rewards go to</span>
            <div className="walletline" style={{ marginTop: 6 }}>{wallet}</div>
          </div>
          <div className="row">
            <button className="btn primary" type="submit" disabled={busy}>{mine ? "Update setup" : "Post setup"}</button>
            {mine && <button className="btn ghost" type="button" onClick={remove}>{confirmRemove ? "Confirm: remove my setup" : "Remove my setup"}</button>}
          </div>
          {msg && <p className={`msg ${msg.ok ? "ok" : "err"}`} role="status">{msg.text}</p>}
        </div>
      </form>
    </section>
  );
}
