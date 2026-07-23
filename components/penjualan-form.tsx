"use client";

import { useMemo, useState, useTransition } from "react";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { Badge, Button, Card, Input, Label, Select } from "@/components/ui/primitives";
import { createPenjualanAction } from "@/app/actions/penjualan";
import { formatKg, formatRupiah } from "@/lib/utils";
import type { PenjualanItemInput, StokRingkas } from "@/types";

export function PenjualanForm({ stok }: { stok: StokRingkas[] }) {
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().slice(0, 10));
  const [pengepul, setPengepul] = useState("");
  const [items, setItems] = useState<PenjualanItemInput[]>([]);

  const [lineJenisId, setLineJenisId] = useState("");
  const [lineBerat, setLineBerat] = useState("");
  const [lineHargaMode, setLineHargaMode] = useState<"per_kg" | "total">("per_kg");
  const [lineHarga, setLineHarga] = useState("");
  const [lineJualHabis, setLineJualHabis] = useState(false);
  const [lineError, setLineError] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const beratTerpakaiPerJenis = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      // item "jual habis" sebelumnya sudah menghabiskan seluruh stok jenis itu,
      // jadi item berikutnya dengan jenis yang sama dianggap tidak ada sisa lagi.
      map.set(item.jenisId, item.jualHabis ? Infinity : (map.get(item.jenisId) ?? 0) + item.berat);
    }
    return map;
  }, [items]);

  // Jenis yang sudah masuk keranjang atau sudah habis stoknya (setelah
  // dikurangi item lain di keranjang) tidak ditampilkan lagi di dropdown —
  // supaya tidak dobel dan tidak salah pilih jenis yang sudah tidak ada stok.
  const jenisTersedia = useMemo(
    () =>
      stok.filter((s) => {
        const sudahDiKeranjang = items.some((i) => i.jenisId === s.jenis_id);
        if (sudahDiKeranjang) return false;
        const sisa = s.total_sisa_kg - (beratTerpakaiPerJenis.get(s.jenis_id) ?? 0);
        return sisa > 0.0001;
      }),
    [stok, items, beratTerpakaiPerJenis]
  );

  const stokJenis = stok.find((s) => s.jenis_id === lineJenisId);
  const sisaSetelahDikurangiKeranjang = stokJenis
    ? Math.max(0, stokJenis.total_sisa_kg - (beratTerpakaiPerJenis.get(lineJenisId) ?? 0))
    : null;

  const totalBerat = items.reduce((sum, i) => sum + i.berat, 0);
  const totalHarga = items.reduce((sum, i) => sum + i.totalHarga, 0);

  function resetLine() {
    setLineJenisId("");
    setLineBerat("");
    setLineHarga("");
    setLineHargaMode("per_kg");
    setLineJualHabis(false);
  }

  function handleTambahKeDaftar() {
    setLineError(null);
    const jenis = stok.find((s) => s.jenis_id === lineJenisId);
    const berat = Number(lineBerat);
    const hargaInput = Number(lineHarga);

    if (!jenis) return setLineError("Pilih jenis sampah terlebih dahulu.");
    if (!berat || berat <= 0) return setLineError("Berat harus lebih dari nol.");
    if (!lineHarga || hargaInput < 0) return setLineError("Isi harga jual.");
    if (
      !lineJualHabis &&
      sisaSetelahDikurangiKeranjang !== null &&
      berat > sisaSetelahDikurangiKeranjang
    ) {
      return setLineError(
        `Stok ${jenis.jenis_nama} tersisa ${formatKg(sisaSetelahDikurangiKeranjang)} setelah dikurangi item di daftar. Kalau ini karena selisih timbangan, centang "jual habis" di bawah.`
      );
    }

    const totalHargaItem = lineHargaMode === "per_kg" ? hargaInput * berat : hargaInput;

    setItems((prev) => [
      ...prev,
      {
        jenisId: jenis.jenis_id,
        jenisNama: jenis.jenis_nama,
        berat,
        totalHarga: totalHargaItem,
        jualHabis: lineJualHabis,
        stokSaatDitambahkan: sisaSetelahDikurangiKeranjang ?? undefined,
      },
    ]);
    resetLine();
  }

  function handleSubmit() {
    setError(null);
    if (!tanggal) return setError("Tanggal wajib diisi.");
    if (!pengepul.trim()) return setError("Nama pengepul wajib diisi.");
    if (items.length === 0) return setError("Tambahkan minimal 1 jenis sampah ke daftar penjualan.");

    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("tanggal", tanggal);
        fd.set("pengepul", pengepul.trim());
        fd.set(
          "items",
          JSON.stringify(
            items.map((i) => ({
              jenisId: i.jenisId,
              berat: i.berat,
              totalHarga: i.totalHarga,
              jualHabis: i.jualHabis,
            }))
          )
        );
        await createPenjualanAction(fd);
        setItems([]);
        setPengepul("");
        setTanggal(new Date().toISOString().slice(0, 10));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal menyimpan.");
      }
    });
  }

  return (
    <Card className="p-4 mb-6">
      <p className="text-sm font-medium mb-3">Catat penjualan ke pengepul</p>

      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="tanggal">Tanggal</Label>
            <Input
              id="tanggal"
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="pengepul">Pengepul</Label>
            <Input
              id="pengepul"
              placeholder="UD Sumber Rejeki"
              value={pengepul}
              onChange={(e) => setPengepul(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="rounded-xl border border-line bg-bg p-3">
          <p className="text-xs font-medium text-ink-soft mb-2">Tambah jenis sampah ke daftar</p>

          {jenisTersedia.length === 0 ? (
            <p className="text-xs text-ink-soft py-1">
              Semua jenis dengan stok sudah masuk ke daftar, atau belum ada stok tersisa sama sekali.
            </p>
          ) : (
            <>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="line_jenis">Jenis sampah</Label>
                  <Select
                    id="line_jenis"
                    value={lineJenisId}
                    onChange={(e) => setLineJenisId(e.target.value)}
                  >
                    <option value="" disabled>
                      Pilih jenis
                    </option>
                    {jenisTersedia.map((s) => (
                      <option key={s.jenis_id} value={s.jenis_id}>
                        {s.jenis_nama}
                      </option>
                    ))}
                  </Select>
                  {sisaSetelahDikurangiKeranjang !== null && (
                    <p className="text-xs text-ink-soft mt-1">
                      Sisa stok tercatat: {formatKg(sisaSetelahDikurangiKeranjang)}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="line_berat">Berat timbangan (kg)</Label>
                    <Input
                      id="line_berat"
                      type="number"
                      min={0}
                      step="0.1"
                      value={lineBerat}
                      onChange={(e) => setLineBerat(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="line_harga">
                      Harga {lineHargaMode === "per_kg" ? "/ kg" : "total"}
                    </Label>
                    <Input
                      id="line_harga"
                      type="number"
                      min={0}
                      step="1"
                      value={lineHarga}
                      onChange={(e) => setLineHarga(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-2 mt-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={lineJualHabis}
                  onChange={(e) => setLineJualHabis(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded accent-primary shrink-0"
                />
                <span className="text-xs text-ink-soft">
                  Jenis ini terjual habis dari stok (ada selisih timbangan dengan pengepul)
                </span>
              </label>
              {lineJualHabis && stokJenis && (
                <p className="flex items-center gap-1.5 text-xs text-amber-600 mt-1.5">
                  <AlertTriangle size={12} className="shrink-0" /> Seluruh stok tercatat (
                  {formatKg(sisaSetelahDikurangiKeranjang ?? 0)}) akan dianggap habis, terlepas dari
                  berat yang kamu isi di atas.
                </p>
              )}

              <div className="flex flex-col gap-2 mt-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setLineHargaMode("per_kg")}
                    className={`flex-1 sm:flex-none px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      lineHargaMode === "per_kg"
                        ? "bg-primary text-white border-primary"
                        : "bg-white border-line text-ink-soft"
                    }`}
                  >
                    Harga per kg
                  </button>
                  <button
                    type="button"
                    onClick={() => setLineHargaMode("total")}
                    className={`flex-1 sm:flex-none px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      lineHargaMode === "total"
                        ? "bg-primary text-white border-primary"
                        : "bg-white border-line text-ink-soft"
                    }`}
                  >
                    Total harga
                  </button>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="w-full sm:w-auto"
                  onClick={handleTambahKeDaftar}
                >
                  <Plus size={14} /> Tambah ke daftar
                </Button>
              </div>
              {lineError && <p className="text-xs text-danger mt-2">{lineError}</p>}
            </>
          )}
        </div>

        {items.length > 0 && (
          <div className="space-y-2">
            {items.map((item, idx) => {
              const susut =
                item.jualHabis && item.stokSaatDitambahkan !== undefined
                  ? item.stokSaatDitambahkan - item.berat
                  : null;
              return (
                <div
                  key={`${item.jenisId}-${idx}`}
                  className="rounded-xl border border-line bg-surface px-3 py-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.jenisNama}</p>
                      <p className="text-xs text-ink-soft">{formatKg(item.berat)}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <p className="text-sm font-medium">{formatRupiah(item.totalHarga)}</p>
                      <button
                        type="button"
                        onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-ink-soft hover:text-danger"
                        aria-label={`Hapus ${item.jenisNama} dari daftar`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  {item.jualHabis && (
                    <p className="text-xs text-amber-600 mt-1.5">
                      Jual habis · stok dihabiskan {formatKg(item.stokSaatDitambahkan ?? 0)}
                      {susut !== null && susut !== 0 && (
                        <> ({susut > 0 ? "susut" : "lebih"} {formatKg(Math.abs(susut))})</>
                      )}
                    </p>
                  )}
                </div>
              );
            })}

            <div className="flex items-center justify-between rounded-xl bg-primary-soft px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Badge>{items.length} jenis</Badge>
                <span className="text-xs text-primary-ink">{formatKg(totalBerat)}</span>
              </div>
              <p className="font-display font-semibold text-sm text-primary-ink">
                {formatRupiah(totalHarga)}
              </p>
            </div>
          </div>
        )}

        <Button type="button" size="lg" className="w-full" loading={pending} onClick={handleSubmit}>
          {pending ? "Menyimpan..." : `Catat Penjualan${items.length > 0 ? ` (${items.length} jenis)` : ""}`}
        </Button>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    </Card>
  );
}
