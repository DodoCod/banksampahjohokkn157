"use client";

import { useState, useTransition, type ReactNode } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/primitives";

export function ConfirmDeleteButton({
  title,
  description,
  confirmLabel = "Hapus",
  onConfirm,
  trigger,
  size = "sm",
  triggerVariant = "ghost",
}: {
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void>;
  trigger?: ReactNode;
  size?: "sm" | "md";
  triggerVariant?: "ghost" | "secondary" | "danger";
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      try {
        await onConfirm();
        setOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal menghapus.");
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant={triggerVariant}
        size={size}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        {trigger ?? <Trash2 size={14} className="text-danger" />}
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-surface rounded-xl border border-line shadow-lg p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-full bg-danger-soft flex items-center justify-center">
                <AlertTriangle size={18} className="text-danger" strokeWidth={2} />
              </div>
              <button
                type="button"
                onClick={() => !pending && setOpen(false)}
                className="text-ink-soft hover:text-ink"
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            <p className="font-display font-semibold text-base mb-1">{title}</p>
            {description && <p className="text-sm text-ink-soft mb-4">{description}</p>}

            {error && <p className="text-sm text-danger mb-3">{error}</p>}

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)} disabled={pending}>
                Batal
              </Button>
              <Button type="button" variant="danger" size="sm" onClick={handleConfirm} loading={pending}>
                {pending ? "Menghapus..." : confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
