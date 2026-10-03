import "server-only";
import type { User } from "@supabase/supabase-js";
import { adminClient } from "./supabase-server";
import { SOL_ADDRESS } from "./format";

export type Caller = { user: User; wallet: string; isAdmin: boolean };

/** The Solana address a Sign-in-with-Solana user signed with. */
export function walletOf(user: User): string | null {
  const candidates: unknown[] = [
    (user.user_metadata as { custom_claims?: { address?: string } } | undefined)?.custom_claims?.address,
  ];
  for (const id of user.identities ?? []) {
    const data = id.identity_data as { address?: string; sub?: string; custom_claims?: { address?: string } } | undefined;
    candidates.push(data?.address, data?.custom_claims?.address);
    const sub = data?.sub ?? id.id;
    if (typeof sub === "string" && sub.startsWith("web3:solana:")) candidates.push(sub.slice("web3:solana:".length));
  }
  for (const c of candidates) if (typeof c === "string" && SOL_ADDRESS.test(c)) return c;
  return null;
}

export function adminWallets() {
  return (process.env.ADMIN_WALLETS ?? "").split(",").map(s => s.trim()).filter(Boolean);
}

/** Checks the bearer token from the browser and returns the signed-in wallet, or null. */
export async function getCaller(req: Request): Promise<Caller | null> {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await adminClient().auth.getUser(token);
  if (error || !data.user) return null;
  const wallet = walletOf(data.user);
  if (!wallet) return null;
  return { user: data.user, wallet, isAdmin: adminWallets().includes(wallet) };
}

export const fail = (status: number, error: string) => Response.json({ error }, { status });
