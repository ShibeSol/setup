"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletButton, WalletError } from "./Wallet";

const TABS = [
  { href: "/", label: "Rate" },
  { href: "/top", label: "Top" },
  { href: "/post", label: "Post" },
  { href: "/rewards", label: "Rewards" },
];

export function Header() {
  const path = usePathname();
  return (
    <>
      <header className="top">
        <div className="top-inner">
          <Link href="/" className="brand">rate my setup<span className="dot">.</span><small>pc · battlestations · desks</small></Link>
          <nav className="tabs" aria-label="Sections">
            {TABS.map(t => (
              <Link key={t.href} href={t.href} aria-current={path === t.href ? "page" : undefined}>{t.label}</Link>
            ))}
          </nav>
          <WalletButton />
        </div>
        <div className="led" aria-hidden="true" />
      </header>
      <WalletError />
    </>
  );
}
