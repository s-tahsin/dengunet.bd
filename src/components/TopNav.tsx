"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/lib/store";

const LINKS = [
  { href: "/", label: "Risk map" },
  { href: "/hospitals", label: "Hospitals" },
  { href: "/emergency", label: "Emergency" },
  { href: "/medicine", label: "Medicine" },
];

const ROLE_LINK = {
  public: { href: "/portal", label: "My portal" },
  hospital: { href: "/staff", label: "Staff portal" },
  admin: { href: "/admin", label: "Admin" },
} as const;

export function Logo() {
  return (
    <span aria-hidden className="relative inline-flex h-8 w-8 items-center justify-center rounded-md bg-brand">
      <span className="h-3.5 w-3.5 rounded-full bg-dot" />
    </span>
  );
}

export default function TopNav() {
  const path = usePathname();
  const router = useRouter();
  const { user, signOut } = useApp();
  const links = user ? [...LINKS, ROLE_LINK[user.role]] : LINKS;
  return (
    <header className="sticky top-0 z-[1100] border-b border-line bg-surface">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-4 py-2 md:h-14 md:flex-nowrap md:py-0">
        <Link href="/" className="mr-auto flex items-center gap-2.5 md:mr-0">
          <Logo />
          <span className="text-[17px] font-semibold leading-none tracking-tight">
            DengueNet <span className="text-brand">BD</span>
          </span>
        </Link>
        <nav aria-label="Main" className="order-last -mx-1 flex w-full gap-1 overflow-x-auto md:order-none md:mx-0 md:w-auto md:flex-1">
          {links.map((l) => {
            const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-[14px] font-medium ${
                  active ? "bg-brand-soft text-brand" : "text-muted hover:bg-paper hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <a
          href="tel:999"
          aria-label="Call 999, national emergency"
          className="flex items-center gap-1.5 rounded-md border border-dot/30 px-3 py-1.5 text-[14px] font-semibold text-dot hover:bg-dot/5"
        >
          <span className="sm:hidden">999</span>
          <span className="hidden sm:inline">Emergency 999</span>
        </a>
        {user ? (
          <button
            onClick={() => {
              signOut();
              router.push("/");
            }}
            className="rounded-md border border-line px-3 py-1.5 text-[14px] font-medium hover:border-ink"
          >
            Sign out
          </button>
        ) : (
          <Link
            href="/login"
            className={`rounded-md px-3 py-1.5 text-[14px] font-medium ${
              path === "/login" || path === "/signup" ? "bg-brand text-white" : "bg-ink text-white hover:bg-brand"
            }`}
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
