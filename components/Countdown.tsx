"use client";
import { useEffect, useState } from "react";

export function timeLeft(endsAt: string | null, now: number) {
  if (!endsAt) return "No end time set";
  const ms = new Date(endsAt).getTime() - now;
  if (ms <= 0) return "Round ended, payouts pending";
  const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1e3) % 60;
  return (d ? `${d}d ` : "") + `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

export function Countdown({ endsAt }: { endsAt: string | null }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return <b suppressHydrationWarning>{now === null ? "…" : timeLeft(endsAt, now)}</b>;
}
