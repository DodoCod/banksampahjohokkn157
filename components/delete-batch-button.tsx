"use client";

import { Trash2 } from "lucide-react";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import { deleteBatchAction } from "@/app/actions/batch";

export function DeleteBatchButton({
  id,
  tanggal,
  hasSetoran,
}: {
  id: string;
  tanggal: string;
  /** true jika batch ini sudah punya minimal 1 setoran warga tercatat. */
  hasSetoran: boolean;
}) {
  return (
    <ConfirmDeleteButton
      title={`Hapus batch ${tanggal}?`}
      description="Semua data setoran di batch ini akan ikut terhapus. Batch yang sudah pernah dijual tidak bisa dihapus."
      confirmLabel="Hapus Batch"
      size="md"
      triggerVariant="danger"
      disabled={hasSetoran}
      disabledReason="Batch ini sudah punya setoran warga tercatat, jadi tidak bisa dihapus lagi. Hapus per-setoran belum didukung."
      trigger={
        <span className="inline-flex items-center gap-1.5">
          <Trash2 size={14} /> Hapus Batch
        </span>
      }
      onConfirm={async () => {
        const fd = new FormData();
        fd.set("id", id);
        await deleteBatchAction(fd);
      }}
    />
  );
}
