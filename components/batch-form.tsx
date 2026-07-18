"use client";

import { Button, Card, Input, Label } from "@/components/ui/primitives";
import { createBatchAction } from "@/app/actions/batch";

export function BatchForm() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Card className="p-4 mb-6">
      <p className="text-sm font-medium mb-3">Buat batch pengumpulan baru</p>
      <form action={createBatchAction} className="grid sm:grid-cols-[1fr_2fr_auto] gap-3 items-end">
        <div>
          <Label htmlFor="tanggal">Tanggal</Label>
          <Input id="tanggal" name="tanggal" type="date" defaultValue={today} required />
        </div>
        <div>
          <Label htmlFor="keterangan">Keterangan</Label>
          <Input id="keterangan" name="keterangan" placeholder="Pengumpulan RW 03" />
        </div>
        <Button type="submit">Buat Batch</Button>
      </form>
    </Card>
  );
}
