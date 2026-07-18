"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Recycle, LayoutDashboard, Layers, Boxes, Banknote, Wallet, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/app/actions/auth";

export const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/batch", label: "Pengumpulan", icon: Layers },
  { href: "/stok", label: "Stok", icon: Boxes },
  { href: "/penjualan", label: "Penjualan", icon: Banknote },
  { href: "/kas", label: "Kas", icon: Wallet },
  { href: "/jenis-sampah", label: "Jenis Sampah", icon: Recycle },
];

/** Sidebar untuk layar desktop/tablet. Disembunyikan di mobile (diganti bottom nav). */
export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-60 min-h-screen shrink-0 border-r border-line bg-surface flex-col">
      <div className="px-5 py-5 border-b border-line flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Recycle size={16} className="text-white" strokeWidth={2.25} />
        </div>
        <div>
          <p className="font-display text-sm font-semibold leading-tight">Bank Sampah</p>
          <p className="text-xs text-ink-soft">Admin Panel</p>
        </div>
      </div>

      <nav className="flex flex-col flex-1 px-3 py-4 gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors",
                active ? "bg-primary-soft text-primary-ink font-medium" : "text-ink-soft hover:bg-bg"
              )}
            >
              <Icon size={16} strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-line">
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-ink-soft hover:bg-bg transition-colors"
          >
            <LogOut size={16} strokeWidth={2} />
            Logout
          </button>
        </form>
      </div>
    </aside>
  );
}
