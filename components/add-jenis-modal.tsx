"use client";

import { useRef, useState, useTransition } from "react";
import { Button, Input, Label } from "@/components/ui/primitives";
import { Modal } from "@/components/ui/modal";
import { createJenisSampahAction } from "@/app/actions/jenis-sampah";
import type { JenisSampah } from "@/types";

export function AddJenisModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (item: JenisSampah) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClose() {
    if (pending) return;
    setError(null);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Tambah jenis sampah baru"
      description="Jenis baru langsung bisa dipilih untuk setoran ini."
    >
      <form
        ref={formRef}
        action={(formData) => {
          setError(null);
          startTransition(async () => {
            try {
              const item = await createJenisSampahAction(formData);
              if (item) {
                formRef.current?.reset();
                onCreated(item);
              }
            } catch (e) {
              setError(e instanceof Error ? e.message : "Gagal menyimpan.");
            }
          });
        }}
        className="space-y-3"
      >
        <div>
          <Label htmlFor="modal-nama">Nama</Label>
          <Input id="modal-nama" name="nama" placeholder="Botol Plastik" required autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="modal-harga">Harga beli / kg</Label>
            <Input id="modal-harga" name="harga_beli" type="number" min={0} step="1" placeholder="3000" required />
          </div>
          <div>
            <Label htmlFor="modal-satuan">Satuan</Label>
            <Input id="modal-satuan" name="satuan" defaultValue="kg" required />
          </div>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex gap-2 justify-end pt-1">
          <Button type="button" variant="secondary" size="sm" onClick={handleClose} disabled={pending}>
            Batal
          </Button>
          <Button type="submit" size="sm" loading={pending}>
            {pending ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}