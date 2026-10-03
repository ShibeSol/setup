import "server-only";
import { anonClient } from "./supabase-server";
import type { Config, Payout, Standing } from "./types";

export const DEFAULT_CONFIG: Config = { current_round: 1, pool_sol: 0, ends_at: null, split: [50, 30, 20], min_ratings: 5, mint: "" };

export async function getConfig(): Promise<Config> {
  const { data } = await anonClient().from("config").select("current_round, pool_sol, ends_at, split, min_ratings, mint").eq("id", 1).maybeSingle();
  return data ? { ...data, pool_sol: Number(data.pool_sol) } : DEFAULT_CONFIG;
}

export async function getStandings(): Promise<Standing[]> {
  const { data } = await anonClient().from("standings").select("*").order("ranked", { ascending: false }).order("n", { ascending: false }).limit(200);
  return (data ?? []) as Standing[];
}

export async function getPayouts(): Promise<Payout[]> {
  const { data } = await anonClient().from("payouts").select("*").order("paid_at", { ascending: false }).limit(100);
  return (data ?? []).map(p => ({ ...p, amount_sol: Number(p.amount_sol) })) as Payout[];
}

/** Setups currently in line for a payout: enough ratings this round, best weighted score first. */
export function winners(standings: Standing[], config: Config) {
  return standings.filter(s => s.n >= config.min_ratings).slice(0, config.split.length);
}
