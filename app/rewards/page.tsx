import { CopyButton } from "@/components/CopyButton";
import { Countdown } from "@/components/Countdown";
import { getConfig, getPayouts, getStandings, winners } from "@/lib/data";
import { fmtSol, placeName, shortAddr } from "@/lib/format";

export const dynamic = "force-dynamic";

const MEDAL = ["#ffd166", "#d6dbe8", "#e0a27a"];

export default async function RewardsPage() {
  const [config, standings, payouts] = await Promise.all([getConfig(), getStandings(), getPayouts()]);
  const top = winners(standings, config);
  return (
    <section>
      <h2>Round {config.current_round} rewards</h2>
      <p className="sub">The best-rated setups each round split SOL from the dev&apos;s pump.fun creator rewards.</p>

      <div className="pool">
        <div className="panel hero">
          <span className="kicker">This round&apos;s pool</span>
          <div className="pool-amt">{config.pool_sol ? fmtSol(config.pool_sol) : "TBA"}<small className="sol">SOL</small></div>
          <div className="facts">
            <span>Ends in <Countdown endsAt={config.ends_at} /></span>
            <span>Split <b>{config.split.map((p, i) => `${placeName(i)} ${p}%`).join(" · ")}</b></span>
            <span>Needs <b>{config.min_ratings}+ ratings</b></span>
          </div>
          {config.mint && (
            <>
              <div className="ca"><code>{config.mint}</code><CopyButton text={config.mint} /></div>
              <a className="link" href={`https://pump.fun/coin/${config.mint}`} target="_blank" rel="noopener noreferrer">View the token on pump.fun ↗</a>
            </>
          )}
        </div>
        <div className="panel">
          <span className="kicker">How to earn</span>
          <ol className="steps">
            <li>Connect your Solana wallet and post your setup.</li>
            <li>Everyone rates setups 1 to 10 during the round.</li>
            <li>When the round ends, the top {config.split.length} get SOL sent to the wallet they posted with.</li>
            <li>Ratings reset and the next round starts. Your setup stays up.</li>
          </ol>
          <p className="legend">Payouts are sent by hand from the dev wallet and listed below with their Solana transaction, so anyone can check them.</p>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <span className="kicker">On track to win this round</span>
        <div className="winners">
          {config.split.map((pct, i) => {
            const s = top[i];
            return (
              <div key={i} className="win">
                <span className="place" style={{ color: MEDAL[i] ?? "var(--muted)" }}>{i + 1}</span>
                {s ? (
                  <span><div className="t">{s.title}</div><div className="s">{s.avg.toFixed(1)} avg · {s.n} ratings · {shortAddr(s.wallet)}</div></span>
                ) : (
                  <span><div className="t" style={{ color: "var(--muted)" }}>Up for grabs</div><div className="s">No setup has {config.min_ratings}+ ratings yet</div></span>
                )}
                <span className="amt sol">{config.pool_sol ? `${fmtSol((config.pool_sol * pct) / 100)} SOL` : `${pct}%`}<span>{placeName(i)}</span></span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <span className="kicker">Payout history</span>
        {payouts.length === 0 ? (
          <p className="legend">No payouts yet. The first ones go out when round 1 ends.</p>
        ) : (
          <div>
            {payouts.map(p => (
              <div key={p.id} className="paid">
                <span className="r">R{p.round} · {placeName(p.place - 1)}</span>
                <span><b>{p.title}</b> <span style={{ color: "var(--muted)" }}>{shortAddr(p.wallet)}</span></span>
                <span className="sol" style={{ textAlign: "right" }}>
                  {fmtSol(p.amount_sol)} SOL <a className="link" href={`https://solscan.io/tx/${p.tx}`} target="_blank" rel="noopener noreferrer">tx ↗</a>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
