"use client";
import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [label, setLabel] = useState("Copy");
  return (
    <button type="button" className="btn" onClick={async () => {
      try { await navigator.clipboard.writeText(text); setLabel("Copied"); } catch { setLabel("Copy failed"); }
      setTimeout(() => setLabel("Copy"), 1500);
    }}>{label}</button>
  );
}
