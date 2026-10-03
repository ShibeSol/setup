export const SOL_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
export const TX_SIGNATURE = /^[1-9A-HJ-NP-Za-km-z]{64,90}$/;

export const shortAddr = (a: string) => (a ? `${a.slice(0, 4)}…${a.slice(-4)}` : "");
export const fmtSol = (n: number) => (Math.round((Number(n) || 0) * 1000) / 1000).toLocaleString("en-US", { maximumFractionDigits: 3 });
export const placeName = (i: number) => ["1st", "2nd", "3rd", "4th", "5th"][i] ?? `${i + 1}th`;
// 1 = hot pink … 10 = mint, following the header's LED strip
export const scoreColor = (n: number) => `hsl(${(Math.max(1, Math.min(10, n)) - 1) * 15 + 330} 85% 64%)`;

export function imageUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/setup-images/${path}`;
}
