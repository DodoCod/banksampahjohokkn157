"use client";

import { useState, useTransition } from "react";
import { Pencil, X, Check } from "lucide-react";
import { Badge, Button, Card, Input, Label, Td } from "@/components/ui/primitives";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import { cn, formatRupiah } from "@/lib/utils";
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
  layout,
}: {
  item: JenisSampah;
  pending: boolean;
  error: string | null;
  onSave: (formData: FormData) => void;
  onCancel: () => void;
  layout: "row" | "card";
}) {
  return (
    <form
      action={onSave}
      className={cn(
        "rounded-xl border border-primary/30 bg-primary-soft/40 p-3",
        layout === "row" ? "grid grid-cols-[2fr_1.2fr_1fr_auto] gap-3 items-end" : "space-y-3"
      )}
    >
      <input type="hidden" name="id" value={item.id} />

      <div className={layout === "card" ? "grid grid-cols-2 gap-3" : "contents"}>
        <div>
          <Label htmlFor={`nama-${item.id}`}>Nama</Label>
          <Input id={`nama-${item.id}`} name="nama" defaultValue={item.nama} required />
        </div>
        <div>
          <Label htmlFor={`harga-${item.id}`}>Harga beli / kg</Label>
          <Input
            id={`harga-${item.id}`}
            name="harga_beli"
            type="number"
            min={0}
            step="1"
            defaultValue={item.harga_beli}
            required
          />
        </div>
        {layout === "card" && (
          <div>
            <Label htmlFor={`satuan-${item.id}`}>Satuan</Label>
            <Input id={`satuan-${item.id}`} name="satuan" defaultValue={item.satuan} required />
          </div>
        )}
      </div>

      {layout === "row" && (
        <div>
          <Label htmlFor={`satuan-${item.id}`}>Satuan</Label>
          <Input id={`satuan-${item.id}`} name="satuan" defaultValue={item.satuan} required />
        </div>
      )}

      <div className={layout === "row" ? "flex items-center gap-2" : "flex items-center justify-between"}>
        <label className="flex items-center gap-1.5 text-xs text-ink-soft cursor-pointer select-none">
          <input
            type="checkbox"
            name="aktif"
            defaultChecked={item.aktif}
            className="w-4 h-4 rounded accent-primary"
          />
          Aktif
        </label>

        <div className="flex items-center gap-1.5">
          <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={pending}>
            <X size={14} />
          </Button>
          <Button type="submit" size="sm" loading={pending}>
            {pending ? "" : <Check size={14} />}
            {pending ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </div>

      {error && (
        <p className={cn("text-xs text-danger", layout === "row" && "col-span-4")}>{error}</p>
      )}
    </form>
  );
}

/** Baris tabel untuk tampilan desktop. */
export function JenisSampahRow({ item }: { item: JenisSampah }) {
  const { editing, setEditing, error, pending, handleSave, handleDelete } = useJenisSampahEdit(item);

  if (editing) {
    return (
      <tr>
        <Td colSpan={4} className="bg-primary-soft/10">
          <EditForm
            item={item}
            pending={pending}
            error={error}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
            layout="row"
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
      <EditForm
        item={item}
        pending={pending}
        error={error}
        onSave={handleSave}
        onCancel={() => setEditing(false)}
        layout="card"
      />
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
