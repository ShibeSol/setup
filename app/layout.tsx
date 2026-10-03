import type { Metadata, Viewport } from "next";
import { Header } from "@/components/Header";
import { WalletProvider } from "@/components/Wallet";
import "./globals.css";

export const metadata: Metadata = {
  title: "rate my setup",
  description: "Post your PC or gaming setup, rate everyone else's, and the top setups each round earn SOL.",
};

export const viewport: Viewport = { themeColor: "#0c0d18", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Unbounded:wght@500;700;800&family=Figtree:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" />
      </head>
      <body>
        <WalletProvider>
          <div className="wrap">
            <Header />
            <main>{children}</main>
            <footer className="foot">
              Rewards are paid by hand from the dev wallet. Every payout is listed on the Rewards page with its transaction.
            </footer>
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}
