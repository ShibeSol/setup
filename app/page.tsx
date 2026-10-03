"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Photo, Specs, Who } from "@/components/SetupBits";
import { useWallet } from "@/components/Wallet";
import { scoreColor } from "@/lib/format";
import type { Standing } from "@/lib/types";

type Queue = { round: number; endsAt: string | null; rated: number; total: number; setups: Standing[] };
type Result = { id: string; score: number; avg: number; n: number };

export default function RatePage() {
  const { wallet, ready, connect, authFetch } = useWallet();
  const [queue, setQueue] = useState<Queue | null>(null);
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await authFetch("/api/queue");
      if (!res.ok) throw new Error();
      setQueue(await res.json()); setIndex(0); setResult(null); setError(null);
    } catch { setError("Couldn't load setups. Refresh to try again."); }
  }, [authFetch]);

  useEffect(() => { if (ready) load(); }, [ready, wallet, load]);

  const s = queue?.setups[index];
  const ended = queue?.endsAt ? new Date(queue.endsAt).getTime() < Date.now() : false;

  async function rate(score: number) {
    if (!s || busy || result) return;
    if (!wallet) { await connect(); return; }
    setBusy(true); setError(null);
    const res = await authFetch("/api/rate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ setupId: s.id, score }) });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(body.error ?? "Your rating didn't save."); return; }
    setResult({ id: s.id, score, avg: body.avg, n: body.n });
    setQueue(q => (q ? { ...q, rated: q.rated + 1 } : q));
  }

  function next() { setResult(null); setError(null); setIndex(i => i + 1); }

  return (
    <section>
      <div className="row spread">
        <div>
          <h2>Rate this setup</h2>
          <p className="sub">1 is a laptop on an ironing board. 10 is the one you&apos;d screenshot.</p>
        </div>
        {queue && <span className="progress">Round {queue.round} · {queue.rated} rated</span>}
      </div>

      {!queue && <div className="empty"><p>{error ?? "Loading setups…"}</p></div>}

      {queue && !s && (
        <div className="empty">
          {queue.total === 0 ? (
            <><h2>No setups yet</h2><p>Be the first. Post yours and start collecting ratings for this round.</p></>
          ) : (
            <><h2>You&apos;ve rated every setup</h2><p>Check the leaderboard, or come back when more people post.</p></>
          )}
          <div className="row" style={{ justifyContent: "center", marginTop: 14 }}>
            <Link className="btn primary" href="/post">Post your setup</Link>
            <Link className="btn" href="/top">See top setups</Link>
          </div>
        </div>
      )}

      {s && (
        <div className="rate-grid">
          <div className="shot"><Photo s={s} eager /></div>
          <div className="card-meta">
            <Who s={s} />
            <div className="title">{s.title}</div>
            {s.tags.length > 0 && <div className="tags">{s.tags.map(t => <span key={t} className="chip">{t}</span>)}</div>}
            <Specs s={s} />
            <div className="pad-label"><span>1 · meh</span><span>10 · dream setup</span></div>
            <div className="scorepad" role="group" aria-label="Score from 1 to 10">
              {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                <button key={n} type="button" style={{ ["--c" as string]: scoreColor(n) }}
                  className={result?.score === n ? "picked" : undefined} aria-pressed={result?.score === n}
                  disabled={busy || !!result || ended} onClick={() => rate(n)}>{n}</button>
              ))}
            </div>
            {ended && <p className="msg err">This round has ended. Rating opens again when the next round starts.</p>}
            {!wallet && !ended && <p className="legend">Tapping a score asks your wallet to sign in. It&apos;s free and moves no funds.</p>}
            {error && <p className="msg err" role="alert">{error}</p>}
            {result ? (
              <>
                <div className="reveal">
                  <span className="big" style={{ color: scoreColor(Math.round(result.avg)) }}>{result.avg.toFixed(1)}</span>
                  <span className="small">Average from {result.n} {result.n === 1 ? "rating" : "ratings"} this round. You gave it {result.score}.</span>
                </div>
                <div className="row"><button type="button" className="btn primary" onClick={next} autoFocus>Next setup →</button></div>
              </>
            ) : (
              <div className="row"><button type="button" className="btn ghost" onClick={next}>Skip</button></div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
