"use client";

import { Trash2 } from "lucide-react";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import { deleteBatchAction } from "@/app/actions/batch";

export function DeleteBatchButton({ id, tanggal }: { id: string; tanggal: string }) {
  return (
    <ConfirmDeleteButton
      title={`Hapus batch ${tanggal}?`}
      description="Semua data setoran di batch ini akan ikut terhapus. Batch yang sudah pernah dijual tidak bisa dihapus."
      confirmLabel="Hapus Batch"
      size="md"
      triggerVariant="danger"
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
