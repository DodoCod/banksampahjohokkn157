"use client";

import { useRef, useState, useTransition } from "react";
import { Button, Card, Input, Label } from "@/components/ui/primitives";
import { createJenisSampahAction } from "@/app/actions/jenis-sampah";

export function JenisSampahForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Card className="p-4 mb-6">
      <p className="text-sm font-medium mb-3">Tambah jenis sampah</p>
      <form
        ref={formRef}
        action={(formData) => {
          setError(null);
          startTransition(async () => {
            try {
              await createJenisSampahAction(formData);
              formRef.current?.reset();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Gagal menyimpan.");
            }
          });
        }}
        className="grid sm:grid-cols-[2fr_1fr_1fr_auto] gap-3 items-end"
      >
        <div>
          <Label htmlFor="nama">Nama</Label>
          <Input id="nama" name="nama" placeholder="Botol Plastik" required />
        </div>
        <div>
          <Label htmlFor="harga_beli">Harga beli / kg</Label>
          <Input id="harga_beli" name="harga_beli" type="number" min={0} step="1" placeholder="3000" required />
        </div>
        <div>
          <Label htmlFor="satuan">Satuan</Label>
          <Input id="satuan" name="satuan" defaultValue="kg" required />
        </div>
        <Button type="submit" loading={pending}>
          {pending ? "Menyimpan..." : "Tambah"}
        </Button>
      </form>
      {error && <p className="text-xs text-danger mt-2">{error}</p>}
    </Card>
  );
}
