"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions/auth";
import type { Role } from "@/lib/constants";
import { ROLES } from "@/lib/constants";
import type { BadgeCounts } from "@/lib/queries";

interface NavItem {
  key: string;
  label: string;
  href: string;
  badgeKey?: keyof BadgeCounts;
}

const NAV_ITEMS: NavItem[] = [
  { key: "home", label: "Dashboard", href: "/ops" },
  { key: "search", label: "Search", href: "/ops/search" },
  { key: "pipeline", label: "Pipeline", href: "/ops/pipeline" },
  { key: "sense", label: "Sense Check", href: "/ops/sense-check", badgeKey: "senseCheck" },
  { key: "exceptions", label: "Exceptions", href: "/ops/exceptions", badgeKey: "exceptions" },
  { key: "customers", label: "Customers", href: "/ops/customers" },
  { key: "ncrs", label: "NCRs", href: "/ops/ncrs" },
  { key: "suppliers", label: "Suppliers", href: "/ops/suppliers" },
  { key: "risks", label: "Risks", href: "/ops/risks" },
  { key: "users", label: "Users", href: "/ops/users" },
  { key: "eng_queue", label: "Review Queue", href: "/reviews" },
];

interface SidebarProps {
  user: { name: string; email: string; role: Role };
  badges: BadgeCounts;
}

export default function Sidebar({ user, badges }: SidebarProps) {
  const pathname = usePathname();
  const allowedNav: readonly string[] = ROLES[user.role].nav;
  const visibleItems = NAV_ITEMS.filter((item) =>
    allowedNav.includes(item.key)
  );

  return (
    <aside className="flex h-screen w-64 flex-col bg-teal text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-5">
        <h1 className="text-lg font-bold tracking-tight">Eisla Ops Hub</h1>
        {badges.overdue > 0 && (
          <span className="mt-1 inline-block rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium">
            {badges.overdue} overdue
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/ops" && pathname.startsWith(item.href));
            const badge = item.badgeKey ? badges[item.badgeKey] : 0;

            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white/15 text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span>{item.label}</span>
                  {badge > 0 && (
                    <span className="rounded-full bg-copper px-2 py-0.5 text-xs font-medium">
                      {badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Footer */}
      <div className="border-t border-white/10 px-4 py-4">
        <div className="mb-3">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-white/60">{user.email}</p>
          <p className="mt-0.5 text-xs capitalize text-copper">{user.role}</p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="w-full rounded-md border border-white/20 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
