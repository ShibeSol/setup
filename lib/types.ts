export type Config = {
  current_round: number;
  pool_sol: number;
  ends_at: string | null;
  split: number[];
  min_ratings: number;
  mint: string;
};

export type Standing = {
  id: string;
  title: string;
  handle: string;
  wallet: string;
  cpu: string;
  gpu: string;
  monitor: string;
  peripherals: string;
  tags: string[];
  image_path: string;
  created_at: string;
  n: number;
  avg: number;
  ranked: number;
};

export type Payout = {
  id: string;
  round: number;
  place: number;
  title: string;
  wallet: string;
  amount_sol: number;
  tx: string;
  paid_at: string;
};

export const TAGS = ["RGB", "Minimal", "White build", "Cozy", "Battlestation", "Multi-monitor", "Laptop", "Console", "Budget", "Cable managed"];
