"use client";

import { Recycle, LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";

/** Header atas untuk mobile: logo + nama app + tombol logout. Sidebar desktop punya logout sendiri. */
export function MobileHeader() {
  return (
    <header className="md:hidden sticky top-0 z-30 bg-surface border-b border-line px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Recycle size={14} className="text-white" strokeWidth={2.25} />
        </div>
        <p className="font-display text-sm font-semibold">Bank Sampah Admin</p>
      </div>
      <form action={logoutAction}>
        <button
          type="submit"
          aria-label="Logout"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-soft hover:bg-bg hover:text-danger transition-colors"
        >
          <LogOut size={16} strokeWidth={2} />
        </button>
      </form>
    </header>
  );
}
