"use client";
import type { Session, User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { browserClient } from "@/lib/supabase-browser";
import { SOL_ADDRESS, shortAddr } from "@/lib/format";

type SolanaProvider = { isPhantom?: boolean; publicKey?: unknown; connect: () => Promise<unknown>; signMessage: (...a: never[]) => Promise<unknown> };
declare global {
  interface Window { solana?: SolanaProvider; phantom?: { solana?: SolanaProvider } }
}

type WalletCtx = {
  session: Session | null;
  wallet: string | null;
  ready: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  authFetch: (url: string, init?: RequestInit) => Promise<Response>;
  error: string | null;
};

const Ctx = createContext<WalletCtx | null>(null);

function walletOf(user: User | undefined): string | null {
  if (!user) return null;
  const meta = user.user_metadata as { custom_claims?: { address?: string } } | undefined;
  const c: unknown[] = [meta?.custom_claims?.address];
  for (const id of user.identities ?? []) {
    const d = id.identity_data as { address?: string; sub?: string } | undefined;
    c.push(d?.address);
    const sub = d?.sub ?? id.id;
    if (typeof sub === "string" && sub.startsWith("web3:solana:")) c.push(sub.slice(12));
  }
  return (c.find(x => typeof x === "string" && SOL_ADDRESS.test(x)) as string | undefined) ?? null;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sb = browserClient();
    sb.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    const provider = window.phantom?.solana ?? window.solana;
    if (!provider) {
      setError("No Solana wallet found. Install Phantom (phantom.com) or open this site in your wallet's browser.");
      return;
    }
    const { error } = await browserClient().auth.signInWithWeb3({
      chain: "solana",
      // Phantom requires a statement. Signing a message costs nothing and moves no funds.
      statement: "Sign in to rate my setup. This is free and does not move any funds.",
      wallet: provider as never,
    });
    if (error) setError(error.message.includes("rejected") ? "Sign-in cancelled in your wallet." : error.message);
  }, []);

  const disconnect = useCallback(async () => { await browserClient().auth.signOut(); }, []);

  const authFetch = useCallback(async (url: string, init: RequestInit = {}) => {
    const { data } = await browserClient().auth.getSession();
    const headers = new Headers(init.headers);
    if (data.session) headers.set("authorization", `Bearer ${data.session.access_token}`);
    return fetch(url, { ...init, headers });
  }, []);

  const value = useMemo(() => ({ session, wallet: walletOf(session?.user), ready, connect, disconnect, authFetch, error }), [session, ready, connect, disconnect, authFetch, error]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWallet() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useWallet must be used inside WalletProvider");
  return v;
}

export function WalletButton() {
  const { wallet, ready, connect, disconnect } = useWallet();
  if (!ready) return <span className="btn ghost wallet-btn" aria-busy="true">…</span>;
  if (!wallet) return <button type="button" className="btn primary wallet-btn" onClick={connect}>Connect wallet</button>;
  return (
    <button type="button" className="btn wallet-btn" onClick={disconnect} title="Disconnect">
      <span className="dot-live" aria-hidden="true" />{shortAddr(wallet)}
    </button>
  );
}

export function WalletError() {
  const { error } = useWallet();
  return error ? <p className="notice warn" role="alert">{error}</p> : null;
}
