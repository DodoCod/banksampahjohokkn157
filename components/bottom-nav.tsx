"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV } from "@/components/sidebar-nav";

/** Bottom nav untuk layar mobile. Sidebar disembunyikan, ini jadi satu-satunya navigasi. */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-line pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-6">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] leading-tight",
                active ? "text-primary" : "text-ink-soft"
              )}
            >
              <Icon size={18} strokeWidth={active ? 2.4 : 2} />
              <span className="truncate max-w-[52px]">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
