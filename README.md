# rate my setup

People post their PC or gaming setup, everyone rates setups 1 to 10, and the top setups each round earn SOL from the dev's pump.fun creator rewards.

- **Rate**: one setup at a time, score 1–10, then see the round's average.
- **Top**: this round's leaderboard, weighted so a single 10 can't beat many 9s (`(6×3 + sum) / (3 + n)`).
- **Post**: photo, specs and tags. One setup per wallet; the wallet you sign in with is where rewards go.
- **Rewards**: pool, countdown, payout split, token link, who's on track to win, and every payout with its Solscan link.
- **/admin**: round settings, record payouts, start the next round, hide setups that break the rules.

Stack: Next.js (App Router) on Vercel, Supabase (Postgres, Storage, Sign in with Solana).

## How the money works

Payouts are manual on purpose. The site never holds a private key. At the end of a round:

1. Claim your creator rewards on pump.fun.
2. Open `/admin`, check the winners, and send each one their SOL from your wallet.
3. Paste each transaction signature into `/admin` so it shows in the public history.
4. Press **Start round N+1**. The leaderboard resets; setups stay up.

## Stopping people from farming payouts

Wallets are free to make, so wallet sign-in alone doesn't stop one person voting for themselves with many wallets. The site has:

- **Token-holder voting** (`MIN_TOKEN_HOLDING`): only wallets holding at least this many of your token can rate. This puts a real cost on fake wallets. Turn it on once the token is live.
- No rating your own setup, one rating per setup per wallet per round, and at most 200 ratings per wallet per hour.
- A minimum number of ratings before a setup can win (set in `/admin`).
- Individual votes are never readable from the browser, so nobody can see who voted what.
- You review winners before paying and can hide setups.

## Setup

1. **Supabase**: create a project at supabase.com.
   - SQL editor: run the files in `supabase/migrations/` in order.
   - Authentication → Sign In / Providers: enable **Web3 Wallet → Solana**.
   - Authentication → URL Configuration: set the Site URL to your domain (and add `http://localhost:3000` for local dev).
   - Optional but recommended: turn on CAPTCHA and the auth rate limits.
2. **Env vars**: copy `.env.example` to `.env.local` and fill it in. `ADMIN_WALLETS` is your Phantom address.
3. **Run locally**: `npm install && npm run dev`, then open http://localhost:3000.
4. **Deploy**: import the repo on vercel.com, add the same env vars, deploy, then point your domain at it.

For the token-holding check, use a paid RPC (Helius, QuickNode, Triton) in `SOLANA_RPC_URL`; the public endpoint rate-limits quickly.

## Checks

```
npm run typecheck
npm run build
```
