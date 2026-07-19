"use client";

import { useState, useTransition } from "react";
import { Pencil, X } from "lucide-react";
import { Badge, Button, Card, Input, Td } from "@/components/ui/primitives";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import { formatRupiah } from "@/lib/utils";
import { updateJenisSampahAction, deleteJenisSampahAction } from "@/app/actions/jenis-sampah";
import type { JenisSampah } from "@/types";

function useJenisSampahEdit(item: JenisSampah) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSave(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await updateJenisSampahAction(formData);
        setEditing(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal menyimpan.");
      }
    });
  }

  async function handleDelete() {
    const fd = new FormData();
    fd.set("id", item.id);
    await deleteJenisSampahAction(fd);
  }

  return { editing, setEditing, error, pending, handleSave, handleDelete };
}

function EditForm({
  item,
  pending,
  error,
  onSave,
  onCancel,
  className,
}: {
  item: JenisSampah;
  pending: boolean;
  error: string | null;
  onSave: (formData: FormData) => void;
  onCancel: () => void;
  className?: string;
}) {
  return (
    <form action={onSave} className={className}>
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
      <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
        <X size={14} />
      </Button>
      {error && <span className="text-xs text-danger basis-full">{error}</span>}
    </form>
  );
}

/** Baris tabel untuk tampilan desktop. */
export function JenisSampahRow({ item }: { item: JenisSampah }) {
  const { editing, setEditing, error, pending, handleSave, handleDelete } = useJenisSampahEdit(item);

  if (editing) {
    return (
      <tr>
        <Td colSpan={4}>
          <EditForm
            item={item}
            pending={pending}
            error={error}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
            className="flex flex-wrap items-end gap-2 py-1"
          />
        </Td>
      </tr>
    );
  }

  return (
    <tr>
      <Td className="font-medium">{item.nama}</Td>
      <Td>
        {formatRupiah(item.harga_beli)} / {item.satuan}
      </Td>
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
            onConfirm={handleDelete}
          />
        </div>
      </Td>
    </tr>
  );
}

/** Kartu untuk tampilan mobile, menu edit/hapus yang sama. */
export function JenisSampahCard({ item }: { item: JenisSampah }) {
  const { editing, setEditing, error, pending, handleSave, handleDelete } = useJenisSampahEdit(item);

  if (editing) {
    return (
      <Card className="p-4">
        <EditForm
          item={item}
          pending={pending}
          error={error}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
          className="flex flex-col gap-2 [&>div]:w-full"
        />
      </Card>
    );
  }

  return (
    <Card className="p-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="font-medium text-sm truncate">{item.nama}</p>
        <p className="text-xs text-ink-soft mt-0.5">
          {formatRupiah(item.harga_beli)} / {item.satuan}
        </p>
        <div className="mt-1.5">
          <Badge tone={item.aktif ? "primary" : "danger"}>{item.aktif ? "Aktif" : "Nonaktif"}</Badge>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
          <Pencil size={14} />
        </Button>
        <ConfirmDeleteButton
          title={`Hapus "${item.nama}"?`}
          description="Tindakan ini tidak bisa dibatalkan. Jenis sampah yang masih memiliki stok tidak bisa dihapus."
          onConfirm={handleDelete}
        />
      </div>
    </Card>
  );
}
