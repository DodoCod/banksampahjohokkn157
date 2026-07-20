"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-surface rounded-2xl border border-line shadow-lg p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-1">
          <p className="font-display font-semibold text-base">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-soft hover:text-ink shrink-0"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>
        {description && <p className="text-sm text-ink-soft mb-4">{description}</p>}
        <div className={description ? "" : "mt-3"}>{children}</div>
      </div>
    </div>
  );
}
