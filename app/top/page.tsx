import { Photo } from "@/components/SetupBits";
import { getConfig, getStandings } from "@/lib/data";
import { scoreColor, shortAddr } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TopPage() {
  const [config, list] = await Promise.all([getConfig(), getStandings()]);
  return (
    <section>
      <h2>Top setups · Round {config.current_round}</h2>
      <p className="sub">Ranked by this round&apos;s ratings, weighted so a single 10 can&apos;t top the board.</p>
      {list.length === 0 && <div className="empty"><h2>Nothing ranked yet</h2><p>Setups show up here as soon as they&apos;re posted.</p></div>}
      <ol className="board" style={{ listStyle: "none", padding: 0 }}>
        {list.map((s, i) => (
          <li key={s.id} className={`entry r${i + 1}`}>
            <span className="rank">{i + 1}</span>
            <span className="thumb"><Photo s={s} /></span>
            <span>
              <div className="t">{s.title}</div>
              <div className="s">{[s.handle ? `@${s.handle}` : shortAddr(s.wallet), s.gpu, s.tags.join(" · ")].filter(Boolean).join(" — ")}</div>
            </span>
            <span className="score">
              <b style={s.n ? { color: scoreColor(Math.round(s.avg)) } : undefined}>{s.n ? s.avg.toFixed(1) : "–"}</b>
              <span>{s.n} {s.n === 1 ? "rating" : "ratings"}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
