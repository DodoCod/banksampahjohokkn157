"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Badge, Button, Card, Input, Label, Select } from "@/components/ui/primitives";
import { AddJenisModal } from "@/components/add-jenis-modal";
import { addSetoranBatchAction } from "@/app/actions/batch";
import { formatKg, formatRupiah } from "@/lib/utils";
import type { JenisSampah, SetoranItemInput } from "@/types";

const MODE_LABEL: Record<SetoranItemInput["mode"], string> = {
  HIBAH: "Hibah",
  DIJUAL: "Dijual",
  SEBAGIAN: "Sebagian",
};

export function SetoranForm({
  batchId,
  jenisList: initialJenisList,
}: {
  batchId: string;
  jenisList: JenisSampah[];
}) {
  const [jenisList, setJenisList] = useState(initialJenisList);
  const [warga, setWarga] = useState("");
  const [items, setItems] = useState<SetoranItemInput[]>([]);

  const [lineJenisId, setLineJenisId] = useState("");
  const [lineMode, setLineMode] = useState<SetoranItemInput["mode"]>("HIBAH");
  const [lineBerat, setLineBerat] = useState("");
  const [lineHibahKg, setLineHibahKg] = useState("");
  const [lineDijualKg, setLineDijualKg] = useState("");
  const [lineHargaBeli, setLineHargaBeli] = useState("");
  const [lineError, setLineError] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [addJenisOpen, setAddJenisOpen] = useState(false);

  const aktif = jenisList.filter((j) => j.aktif);
  const jenisTerpilih = jenisList.find((j) => j.id === lineJenisId);

  const totalBerat = items.reduce((sum, i) => sum + i.berat, 0);
  const totalModal = items.reduce((sum, i) => sum + i.modalPreview, 0);

  function resetLine() {
    setLineJenisId("");
    setLineMode("HIBAH");
    setLineBerat("");
    setLineHibahKg("");
    setLineDijualKg("");
    setLineHargaBeli("");
  }

  function handleTambahKeDaftar() {
    setLineError(null);
    const jenis = jenisList.find((j) => j.id === lineJenisId);

    if (!jenis) return setLineError("Pilih jenis sampah terlebih dahulu.");

    const hargaOverride = lineHargaBeli !== "" ? Number(lineHargaBeli) : undefined;
    const hargaEfektif = hargaOverride !== undefined ? hargaOverride : jenis.harga_beli;

    if (lineMode !== "SEBAGIAN") {
      const berat = Number(lineBerat);
      if (!berat || berat <= 0) return setLineError("Berat harus lebih dari nol.");
      if (lineMode === "DIJUAL" && hargaEfektif < 0) return setLineError("Harga tidak boleh negatif.");

      setItems((prev) => [
        ...prev,
        {
          jenisId: jenis.id,
          jenisNama: jenis.nama,
          mode: lineMode,
          berat,
          hargaBeli: hargaOverride,
          modalPreview: lineMode === "DIJUAL" ? berat * hargaEfektif : 0,
        },
      ]);
    } else {
      const berat = Number(lineBerat);
      const hibahKg = Number(lineHibahKg || 0);
      const dijualKg = Number(lineDijualKg || 0);
      if (!berat || berat <= 0) return setLineError("Total berat harus lebih dari nol.");
      if (hibahKg < 0 || dijualKg < 0) return setLineError("Berat harus lebih dari nol.");
      if (Math.abs(hibahKg + dijualKg - berat) > 0.001) {
        return setLineError("Total hibah + dijual harus sama dengan total berat setoran.");
      }
      if (hargaEfektif < 0) return setLineError("Harga tidak boleh negatif.");

      setItems((prev) => [
        ...prev,
        {
          jenisId: jenis.id,
          jenisNama: jenis.nama,
          mode: lineMode,
          berat,
          hibahKg,
          dijualKg,
          hargaBeli: hargaOverride,
          modalPreview: dijualKg * hargaEfektif,
        },
      ]);
    }

    resetLine();
  }

  function handleSubmit() {
    setError(null);
    if (!warga.trim()) return setError("Nama warga wajib diisi.");
    if (items.length === 0) return setError("Tambahkan minimal 1 jenis sampah ke daftar setoran.");

    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("batch_id", batchId);
        fd.set("warga", warga.trim());
        fd.set(
          "items",
          JSON.stringify(
            items.map((i) => ({
              jenisId: i.jenisId,
              mode: i.mode,
              berat: i.berat,
              hibahKg: i.hibahKg,
              dijualKg: i.dijualKg,
              hargaBeli: i.hargaBeli,
            }))
          )
        );
        await addSetoranBatchAction(fd);
        setItems([]);
        setWarga("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal menyimpan.");
      }
    });
  }

  return (
    <Card className="p-4 mb-6">
      <p className="text-sm font-medium mb-3">Catat setoran warga</p>

      <div className="space-y-4">
        <div>
          <Label htmlFor="warga">Nama warga</Label>
          <Input
            id="warga"
            placeholder="Pak Budi"
            value={warga}
            onChange={(e) => setWarga(e.target.value)}
          />
          <p className="text-xs text-ink-soft mt-1">
            Satu warga bisa menyetor beberapa jenis sampah sekaligus - tambahkan tiap jenis ke daftar di
            bawah, baru simpan semuanya dalam satu kali submit.
          </p>
        </div>

        <div className="rounded-xl border border-line bg-bg p-3">
          <p className="text-xs font-medium text-ink-soft mb-2">Tambah jenis sampah ke daftar</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="line_jenis" className="mb-0">
                  Jenis sampah
                </Label>
                <button
                  type="button"
                  onClick={() => setAddJenisOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary-ink bg-primary-soft px-2 py-1 rounded-lg hover:bg-primary hover:text-white transition-colors"
                >
                  <Plus size={12} strokeWidth={2.5} /> Jenis baru
                </button>
              </div>
              <Select
                id="line_jenis"
                value={lineJenisId}
                onChange={(e) => setLineJenisId(e.target.value)}
              >
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

          <div className="mt-3">
            <Label>Status</Label>
            <div className="flex gap-1.5">
              {(["HIBAH", "DIJUAL", "SEBAGIAN"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setLineMode(m)}
                  className={
                    "flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors " +
                    (lineMode === m
                      ? "bg-primary text-white border-primary"
                      : "bg-white border-line text-ink-soft hover:bg-primary-soft")
                  }
                >
                  {MODE_LABEL[m]}
                </button>
              ))}
            </div>
          </div>

          {lineMode !== "SEBAGIAN" ? (
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <Label htmlFor="line_berat">Berat (kg)</Label>
                <Input
                  id="line_berat"
                  type="number"
                  min={0}
                  step="0.1"
                  value={lineBerat}
                  onChange={(e) => setLineBerat(e.target.value)}
                />
              </div>
              {lineMode === "DIJUAL" && (
                <div>
                  <Label htmlFor="line_harga">Harga beli / kg</Label>
                  <Input
                    id="line_harga"
                    type="number"
                    min={0}
                    step="1"
                    placeholder={jenisTerpilih ? `${jenisTerpilih.harga_beli}` : "harga master"}
                    value={lineHargaBeli}
                    onChange={(e) => setLineHargaBeli(e.target.value)}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
              <div>
                <Label htmlFor="line_berat_total">Total berat (kg)</Label>
                <Input
                  id="line_berat_total"
                  type="number"
                  min={0}
                  step="0.1"
                  value={lineBerat}
                  onChange={(e) => setLineBerat(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="line_hibah_kg">Bagian hibah (kg)</Label>
                <Input
                  id="line_hibah_kg"
                  type="number"
                  min={0}
                  step="0.1"
                  value={lineHibahKg}
                  onChange={(e) => setLineHibahKg(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="line_dijual_kg">Bagian dijual (kg)</Label>
                <Input
                  id="line_dijual_kg"
                  type="number"
                  min={0}
                  step="0.1"
                  value={lineDijualKg}
                  onChange={(e) => setLineDijualKg(e.target.value)}
                />
              </div>
              <div className="col-span-2 sm:col-span-3">
                <Label htmlFor="line_harga2">Harga beli / kg untuk bagian dijual (kosongkan = harga master)</Label>
                <Input
                  id="line_harga2"
                  type="number"
                  min={0}
                  step="1"
                  placeholder={jenisTerpilih ? `${jenisTerpilih.harga_beli}` : "harga master"}
                  value={lineHargaBeli}
                  onChange={(e) => setLineHargaBeli(e.target.value)}
                />
              </div>
            </div>
          )}

          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="w-full mt-3"
            onClick={handleTambahKeDaftar}
          >
            <Plus size={14} /> Tambah ke daftar
          </Button>
          {lineError && <p className="text-xs text-danger mt-2">{lineError}</p>}
        </div>

        {items.length > 0 && (
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={`${item.jenisId}-${idx}`} className="rounded-xl border border-line bg-surface px-3 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.jenisNama}</p>
                    <p className="text-xs text-ink-soft">{formatKg(item.berat)}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge tone={item.mode === "DIJUAL" ? "amber" : "primary"}>{MODE_LABEL[item.mode]}</Badge>
                    <button
                      type="button"
                      onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-ink-soft hover:text-danger p-1 -m-1"
                      aria-label={`Hapus ${item.jenisNama} dari daftar`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                {item.mode === "SEBAGIAN" && (
                  <p className="text-xs text-ink-soft mt-1.5">
                    Hibah {formatKg(item.hibahKg ?? 0)} · Dijual {formatKg(item.dijualKg ?? 0)}
                  </p>
                )}
                {item.modalPreview > 0 && (
                  <p className="text-xs text-ink-soft mt-1">Modal {formatRupiah(item.modalPreview)}</p>
                )}
              </div>
            ))}

            <div className="flex items-center justify-between rounded-xl bg-primary-soft px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Badge>{items.length} jenis</Badge>
                <span className="text-xs text-primary-ink">{formatKg(totalBerat)}</span>
              </div>
              <p className="font-display font-semibold text-sm text-primary-ink">{formatRupiah(totalModal)}</p>
            </div>
          </div>
        )}

        <Button type="button" size="lg" className="w-full" loading={pending} onClick={handleSubmit}>
          {pending
            ? "Menyimpan..."
            : `Simpan Setoran${items.length > 0 ? ` (${items.length} jenis)` : ""}`}
        </Button>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>

      <AddJenisModal
        open={addJenisOpen}
        onClose={() => setAddJenisOpen(false)}
        onCreated={(item) => {
          setJenisList((prev) => [...prev, item]);
          setLineJenisId(item.id);
          setAddJenisOpen(false);
        }}
      />
    </Card>
  );
}