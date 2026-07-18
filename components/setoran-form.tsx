"use client";

import { useRef, useState, useTransition } from "react";
import { Button, Card, Input, Label, Select } from "@/components/ui/primitives";
import { addSetoranAction } from "@/app/actions/batch";
import type { JenisSampah } from "@/types";

export function SetoranForm({ batchId, jenisList }: { batchId: string; jenisList: JenisSampah[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [mode, setMode] = useState<"HIBAH" | "DIJUAL" | "SEBAGIAN">("HIBAH");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const aktif = jenisList.filter((j) => j.aktif);

  return (
    <Card className="p-4 mb-6">
      <p className="text-sm font-medium mb-3">Tambah setoran warga</p>
      <form
        ref={formRef}
        action={(formData) => {
          setError(null);
          startTransition(async () => {
            try {
              await addSetoranAction(formData);
              formRef.current?.reset();
              setMode("HIBAH");
            } catch (e) {
              setError(e instanceof Error ? e.message : "Gagal menyimpan.");
            }
          });
        }}
        className="space-y-3"
      >
        <input type="hidden" name="batch_id" value={batchId} />

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="warga">Nama warga</Label>
            <Input id="warga" name="warga" placeholder="Pak Budi" required />
          </div>
          <div>
            <Label htmlFor="jenis_id">Jenis sampah</Label>
            <Select id="jenis_id" name="jenis_id" required defaultValue="">
              <option value="" disabled>
                Pilih jenis
              </option>
              {aktif.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.nama}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <Label>Status</Label>
          <div className="flex gap-1.5">
            {(["HIBAH", "DIJUAL", "SEBAGIAN"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={
                  "px-3 py-1.5 rounded-md text-xs font-medium border " +
                  (mode === m
                    ? "bg-primary text-white border-primary"
                    : "bg-white border-line text-ink-soft hover:bg-primary-soft")
                }
              >
                {m === "HIBAH" ? "Hibah" : m === "DIJUAL" ? "Dijual" : "Sebagian"}
              </button>
            ))}
          </div>
        </div>

        {mode !== "SEBAGIAN" ? (
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="berat">Berat (kg)</Label>
              <Input id="berat" name="berat" type="number" min={0} step="0.1" required />
            </div>
            {mode === "DIJUAL" && (
              <div>
                <Label htmlFor="harga_beli">Harga beli / kg (kosongkan = pakai harga master)</Label>
                <Input id="harga_beli" name="harga_beli" type="number" min={0} step="1" />
              </div>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="berat">Total berat (kg)</Label>
              <Input id="berat" name="berat" type="number" min={0} step="0.1" required />
            </div>
            <div>
              <Label htmlFor="hibah_kg">Bagian hibah (kg)</Label>
              <Input id="hibah_kg" name="hibah_kg" type="number" min={0} step="0.1" required />
            </div>
            <div>
              <Label htmlFor="dijual_kg">Bagian dijual (kg)</Label>
              <Input id="dijual_kg" name="dijual_kg" type="number" min={0} step="0.1" required />
            </div>
            <div className="sm:col-span-3">
              <Label htmlFor="harga_beli2">Harga beli / kg untuk bagian dijual (kosongkan = harga master)</Label>
              <Input id="harga_beli2" name="harga_beli" type="number" min={0} step="1" />
            </div>
          </div>
        )}

        <input type="hidden" name="mode" value={mode} />

        <Button type="submit" loading={pending}>
          {pending ? "Menyimpan..." : "Tambah Setoran"}
        </Button>
        {error && <p className="text-xs text-danger">{error}</p>}
      </form>
    </Card>
  );
}
