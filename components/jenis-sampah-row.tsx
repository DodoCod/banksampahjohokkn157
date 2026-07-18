"use client";

import { useState, useTransition } from "react";
import { Pencil, X } from "lucide-react";
import { Badge, Button, Input, Td } from "@/components/ui/primitives";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import { formatRupiah } from "@/lib/utils";
import { updateJenisSampahAction, deleteJenisSampahAction } from "@/app/actions/jenis-sampah";
import type { JenisSampah } from "@/types";

export function JenisSampahRow({ item }: { item: JenisSampah }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (editing) {
    return (
      <tr>
        <Td colSpan={5}>
          <form
            action={(formData) => {
              setError(null);
              startTransition(async () => {
                try {
                  await updateJenisSampahAction(formData);
                  setEditing(false);
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Gagal menyimpan.");
                }
              });
            }}
            className="flex flex-wrap items-end gap-2 py-1"
          >
            <input type="hidden" name="id" value={item.id} />
            <div className="w-40">
              <Input name="nama" defaultValue={item.nama} required />
            </div>
            <div className="w-32">
              <Input name="harga_beli" type="number" min={0} step="1" defaultValue={item.harga_beli} required />
            </div>
            <div className="w-20">
              <Input name="satuan" defaultValue={item.satuan} required />
            </div>
            <label className="flex items-center gap-1.5 text-xs text-ink-soft px-1">
              <input type="checkbox" name="aktif" defaultChecked={item.aktif} />
              Aktif
            </label>
            <Button type="submit" size="sm" loading={pending}>
              {pending ? "Menyimpan..." : "Simpan"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
              <X size={14} />
            </Button>
            {error && <span className="text-xs text-danger basis-full">{error}</span>}
          </form>
        </Td>
      </tr>
    );
  }

  return (
    <tr>
      <Td className="font-medium">{item.nama}</Td>
      <Td>{formatRupiah(item.harga_beli)} / {item.satuan}</Td>
      <Td>
        <Badge tone={item.aktif ? "primary" : "danger"}>{item.aktif ? "Aktif" : "Nonaktif"}</Badge>
      </Td>
      <Td className="text-right">
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <Pencil size={14} />
          </Button>
          <ConfirmDeleteButton
            title={`Hapus "${item.nama}"?`}
            description="Tindakan ini tidak bisa dibatalkan. Jenis sampah yang masih memiliki stok tidak bisa dihapus."
            onConfirm={async () => {
              const fd = new FormData();
              fd.set("id", item.id);
              await deleteJenisSampahAction(fd);
            }}
          />
        </div>
        {error && <p className="text-xs text-danger mt-1">{error}</p>}
      </Td>
    </tr>
  );
}
