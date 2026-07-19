"use client";

import { useRef, useState, useTransition } from "react";
import { Button, Card, Input, Label, Select } from "@/components/ui/primitives";
import { createPenjualanAction } from "@/app/actions/penjualan";
import { formatKg } from "@/lib/utils";
import type { StokRingkas } from "@/types";

export function PenjualanForm({ stok }: { stok: StokRingkas[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [jenisId, setJenisId] = useState("");
  const [hargaMode, setHargaMode] = useState<"per_kg" | "total">("per_kg");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const today = new Date().toISOString().slice(0, 10);

  const stokJenis = stok.find((s) => s.jenis_id === jenisId);

  return (
    <Card className="p-4 mb-6">
      <p className="text-sm font-medium mb-3">Catat penjualan ke pengepul</p>
      <form
        ref={formRef}
        action={(formData) => {
          setError(null);
          startTransition(async () => {
            try {
              await createPenjualanAction(formData);
              formRef.current?.reset();
              setJenisId("");
            } catch (e) {
              setError(e instanceof Error ? e.message : "Gagal menyimpan.");
            }
          });
        }}
        className="space-y-3"
      >
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <Label htmlFor="tanggal">Tanggal</Label>
            <Input id="tanggal" name="tanggal" type="date" defaultValue={today} required />
          </div>
          <div>
            <Label htmlFor="pengepul">Pengepul</Label>
            <Input id="pengepul" name="pengepul" placeholder="UD Sumber Rejeki" required />
          </div>
          <div>
            <Label htmlFor="jenis_id">Jenis sampah</Label>
            <Select
              id="jenis_id"
              name="jenis_id"
              required
              value={jenisId}
              onChange={(e) => setJenisId(e.target.value)}
            >
              <option value="" disabled>
                Pilih jenis
              </option>
              {stok.map((s) => (
                <option key={s.jenis_id} value={s.jenis_id}>
                  {s.jenis_nama}
                </option>
              ))}
            </Select>
            {stokJenis && (
              <p className="text-xs text-ink-soft mt-1">Stok tersedia: {formatKg(stokJenis.total_sisa_kg)}</p>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <Label htmlFor="total_kg">Berat dijual (kg)</Label>
            <Input id="total_kg" name="total_kg" type="number" min={0} step="0.1" required />
          </div>
          <div>
            <Label>Cara input harga</Label>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setHargaMode("per_kg")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border ${
                  hargaMode === "per_kg"
                    ? "bg-primary text-white border-primary"
                    : "bg-white border-line text-ink-soft"
                }`}
              >
                Per kg
              </button>
              <button
                type="button"
                onClick={() => setHargaMode("total")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border ${
                  hargaMode === "total"
                    ? "bg-primary text-white border-primary"
                    : "bg-white border-line text-ink-soft"
                }`}
              >
                Total harga
              </button>
            </div>
          </div>
          {hargaMode === "per_kg" ? (
            <div>
              <Label htmlFor="harga_jual_per_kg">Harga jual / kg</Label>
              <Input id="harga_jual_per_kg" name="harga_jual_per_kg" type="number" min={0} step="1" required />
            </div>
          ) : (
            <div>
              <Label htmlFor="total_pendapatan">Total harga jual</Label>
              <Input id="total_pendapatan" name="total_pendapatan" type="number" min={0} step="1" required />
            </div>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full" loading={pending}>
          {pending ? "Menyimpan..." : "Catat Penjualan"}
        </Button>
        {error && <p className="text-xs text-danger">{error}</p>}
      </form>
    </Card>
  );
}
