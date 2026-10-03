"use client";
import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@/components/Wallet";
import { browserClient } from "@/lib/supabase-browser";
import { placeName, shortAddr } from "@/lib/format";
import type { Config, Standing } from "@/lib/types";

type Hidden = { id: string; title: string; wallet: string };

const pad = (n: number) => String(n).padStart(2, "0");
const toLocal = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function AdminPage() {
  const { wallet, ready, connect, authFetch } = useWallet();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [hidden, setHidden] = useState<Hidden[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [armed, setArmed] = useState(false);

  const load = useCallback(async () => {
    const sb = browserClient();
    const [{ data: c }, { data: st }, h] = await Promise.all([
      sb.from("config").select("current_round, pool_sol, ends_at, split, min_ratings, mint").eq("id", 1).single(),
      sb.from("standings").select("*").order("ranked", { ascending: false }).order("n", { ascending: false }).limit(200),
      authFetch("/api/admin/hide").then(r => (r.ok ? r.json() : { setups: [] })),
    ]);
    if (c) setConfig({ ...c, pool_sol: Number(c.pool_sol) });
    setStandings((st ?? []) as Standing[]);
    setHidden(h.setups ?? []);
  }, [authFetch]);

  useEffect(() => {
    if (!wallet) { setIsAdmin(null); return; }
    authFetch("/api/me").then(r => r.json()).then(b => { setIsAdmin(Boolean(b.isAdmin)); if (b.isAdmin) load(); });
  }, [wallet, authFetch, load]);

  async function post(url: string, body: unknown, ok: string) {
    const res = await authFetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const b = await res.json().catch(() => ({}));
    setMsg(res.ok ? { ok: true, text: ok } : { ok: false, text: b.error ?? "That didn't work." });
    if (res.ok) await load();
    return res.ok;
  }

  if (!ready) return null;
  if (!wallet) return <div className="empty"><h2>Dev controls</h2><p>Connect the admin wallet to continue.</p><button className="btn primary" type="button" onClick={connect}>Connect wallet</button></div>;
  if (isAdmin === false) return <div className="empty"><h2>Not an admin wallet</h2><p>{shortAddr(wallet)} isn&apos;t in ADMIN_WALLETS.</p></div>;
  if (!config) return <div className="empty"><p>Loading…</p></div>;

  const eligible = standings.filter(s => s.n >= config.min_ratings).slice(0, config.split.length);

  return (
    <section className="stack">
      <div>
        <h2>Dev controls · Round {config.current_round}</h2>
        <p className="sub">The site can&apos;t send SOL. Pay winners from your own wallet (Phantom etc.), then record the transaction here so it shows in the public payout history.</p>
      </div>
      {msg && <p className={`msg ${msg.ok ? "ok" : "err"}`} role="status">{msg.text}</p>}

      <form className="panel admin" onSubmit={e => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const ends = String(f.get("ends_at") ?? "");
        post("/api/admin/config", {
          pool_sol: f.get("pool_sol"),
          ends_at: ends ? new Date(ends).toISOString() : null,
          min_ratings: f.get("min_ratings"),
          mint: f.get("mint"),
          split: String(f.get("split") ?? "").split(/[,\s]+/).filter(Boolean).map(Number),
        }, "Round settings saved.");
      }}>
        <h3>Round settings</h3>
        <div className="grid3">
          <label className="f" htmlFor="pool_sol">Pool (SOL)<input id="pool_sol" name="pool_sol" type="number" step="0.001" min="0" defaultValue={config.pool_sol || ""} /></label>
          <label className="f" htmlFor="ends_at">Round ends<input id="ends_at" name="ends_at" type="datetime-local" defaultValue={toLocal(config.ends_at)} /></label>
          <label className="f" htmlFor="min_ratings">Min ratings to win<input id="min_ratings" name="min_ratings" type="number" min="0" step="1" defaultValue={config.min_ratings} /></label>
        </div>
        <label className="f" htmlFor="mint">Token contract address (pump.fun)<input id="mint" name="mint" defaultValue={config.mint} maxLength={44} spellCheck={false} autoComplete="off" /></label>
        <label className="f" htmlFor="split">Split by place, in %<input id="split" name="split" defaultValue={config.split.join(", ")} placeholder="50, 30, 20" /></label>
        <div className="row"><button className="btn primary" type="submit">Save round settings</button></div>
      </form>

      <div className="panel admin">
        <h3>Record payouts</h3>
        {eligible.length === 0 && <p className="legend">No setup has {config.min_ratings}+ ratings yet.</p>}
        {eligible.map((s, i) => (
          <form key={s.id} className="pay-row" onSubmit={e => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            post("/api/admin/payout", { setupId: s.id, place: i + 1, amount_sol: f.get("amount"), tx: f.get("tx") }, `Recorded the ${placeName(i)} place payout.`);
          }}>
            <div>
              <div style={{ fontWeight: 700, overflowWrap: "anywhere" }}>{placeName(i)} · {s.title} · {s.avg.toFixed(1)} ({s.n})</div>
              <div className="ca"><code>{s.wallet}</code></div>
            </div>
            <label className="f" htmlFor={`amt-${i}`}>SOL<input id={`amt-${i}`} name="amount" type="number" step="0.001" min="0" defaultValue={config.pool_sol ? ((config.pool_sol * config.split[i]) / 100).toFixed(3) : ""} /></label>
            <label className="f" htmlFor={`tx-${i}`}>Tx signature<input id={`tx-${i}`} name="tx" placeholder="From your wallet or Solscan" spellCheck={false} autoComplete="off" /></label>
            <button className="btn" type="submit">Record paid</button>
          </form>
        ))}
        <div className="row">
          <button className="btn ghost" type="button" onClick={async () => {
            if (!armed) { setArmed(true); return; }
            setArmed(false);
            await post("/api/admin/next-round", { fromRound: config.current_round }, `Round ${config.current_round + 1} started.`);
          }}>{armed ? `Confirm: reset the leaderboard and start round ${config.current_round + 1}` : `Start round ${config.current_round + 1}`}</button>
        </div>
      </div>

      <div className="panel admin">
        <h3>Moderation</h3>
        <p className="legend">Hide anything that isn&apos;t a real setup, is someone else&apos;s photo, or is NSFW. Hidden setups can&apos;t be rated or win.</p>
        {standings.map(s => (
          <div key={s.id} className="row spread" style={{ borderTop: "1px solid var(--line)", paddingTop: 8 }}>
            <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>{s.title} <span style={{ color: "var(--muted)" }}>{shortAddr(s.wallet)} · {s.n} ratings</span></span>
            <button className="btn ghost" type="button" onClick={() => post("/api/admin/hide", { setupId: s.id, hidden: true }, `Hid “${s.title}”.`)}>Hide</button>
          </div>
        ))}
        {hidden.length > 0 && <span className="kicker">Hidden</span>}
        {hidden.map(s => (
          <div key={s.id} className="row spread">
            <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>{s.title} <span style={{ color: "var(--muted)" }}>{shortAddr(s.wallet)}</span></span>
            <button className="btn ghost" type="button" onClick={() => post("/api/admin/hide", { setupId: s.id, hidden: false }, `Restored “${s.title}”.`)}>Restore</button>
          </div>
        ))}
      </div>
    </section>
  );
}
