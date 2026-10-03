import { imageUrl, shortAddr } from "@/lib/format";
import type { Standing } from "@/lib/types";

export function Specs({ s }: { s: Pick<Standing, "cpu" | "gpu" | "monitor" | "peripherals"> }) {
  const rows = [["CPU", s.cpu], ["GPU", s.gpu], ["Monitor", s.monitor], ["Peripherals", s.peripherals]].filter(r => r[1]);
  if (!rows.length) return null;
  return (
    <dl className="specs">
      {rows.map(([k, v]) => [<dt key={`${k}-t`}>{k}</dt>, <dd key={`${k}-d`}>{v}</dd>])}
    </dl>
  );
}

export function Who({ s }: { s: Pick<Standing, "handle" | "wallet"> }) {
  return <div className="who">posted by <b>{s.handle ? `@${s.handle}` : shortAddr(s.wallet)}</b></div>;
}

export function Photo({ s, eager }: { s: Pick<Standing, "image_path" | "title">; eager?: boolean }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={imageUrl(s.image_path)} alt={`Photo of ${s.title}`} loading={eager ? "eager" : "lazy"} />;
}
