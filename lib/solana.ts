import "server-only";

/** Total balance of `mint` held by `owner`, in whole tokens. Works for both SPL Token and Token-2022 mints. */
export async function tokenBalance(owner: string, mint: string): Promise<number> {
  const rpc = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
  const res = await fetch(rpc, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getTokenAccountsByOwner",
      params: [owner, { mint }, { encoding: "jsonParsed", commitment: "confirmed" }],
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Solana RPC returned ${res.status}`);
  const body = await res.json();
  if (body.error) throw new Error(body.error.message ?? "Solana RPC error");
  let total = 0;
  for (const acc of body.result?.value ?? []) {
    total += Number(acc.account?.data?.parsed?.info?.tokenAmount?.uiAmount ?? 0);
  }
  return total;
}

/** Whether `wallet` meets the MIN_TOKEN_HOLDING rule. Passes when the rule is off or no token is set yet. */
export async function meetsHolding(wallet: string, mint: string): Promise<{ ok: boolean; need: number; have?: number }> {
  const need = Number(process.env.MIN_TOKEN_HOLDING || 0);
  if (!need || !mint) return { ok: true, need: 0 };
  const have = await tokenBalance(wallet, mint);
  return { ok: have >= need, need, have };
}
