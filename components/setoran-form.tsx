"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Badge, Button, Card, Input, Label, Select } from "@/components/ui/primitives";
import { AddJenisModal } from "@/components/add-jenis-modal";
import { addSetoranBatchAction } from "@/app/actions/batch";
import { formatKg, formatRupiah } from "@/lib/utils";
import type { JenisSampah, SetoranItemInput } from "@/types";

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
  const [mode, setMode] = useState<"HIBAH" | "DIJUAL" | "SEBAGIAN">("HIBAH");
  const [lineBerat, setLineBerat] = useState("");
  const [lineHargaBeli, setLineHargaBeli] = useState("");
  const [lineHibahKg, setLineHibahKg] = useState("");
  const [lineDijualKg, setLineDijualKg] = useState("");
  const [lineError, setLineError] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [addJenisOpen, setAddJenisOpen] = useState(false);

  const aktif = jenisList.filter((j) => j.aktif);
  // Jenis yang sudah ada di keranjang tidak ditampilkan lagi di dropdown,
  // supaya tidak dobel — kalau perlu tambah lagi untuk jenis yang sama,
  // hapus dulu item lama di keranjang lalu tambahkan ulang dengan angka gabungan.
  const jenisTersedia = aktif.filter((j) => !items.some((i) => i.jenisId === j.id));

  const totalBerat = useMemo(() => items.reduce((sum, i) => sum + i.berat, 0), [items]);
  const totalModal = useMemo(() => items.reduce((sum, i) => sum + i.modal, 0), [items]);

  function resetLine() {
    setLineJenisId("");
    setMode("HIBAH");
    setLineBerat("");
    setLineHargaBeli("");
    setLineHibahKg("");
    setLineDijualKg("");
  }

  function handleTambahKeDaftar() {
    setLineError(null);
    const jenis = jenisList.find((j) => j.id === lineJenisId);
    if (!jenis) return setLineError("Pilih jenis sampah terlebih dahulu.");

    const hargaBeliInput = lineHargaBeli !== "" ? Number(lineHargaBeli) : undefined;
    const hargaBeliDipakai = hargaBeliInput ?? jenis.harga_beli;

    if (mode === "HIBAH") {
      const berat = Number(lineBerat);
      if (!berat || berat <= 0) return setLineError("Berat harus lebih dari nol.");
      setItems((prev) => [
        ...prev,
        { jenisId: jenis.id, jenisNama: jenis.nama, mode, berat, modal: 0 },
      ]);
    } else if (mode === "DIJUAL") {
      const berat = Number(lineBerat);
      if (!berat || berat <= 0) return setLineError("Berat harus lebih dari nol.");
      if (hargaBeliDipakai < 0) return setLineError("Harga tidak boleh negatif.");
      setItems((prev) => [
        ...prev,
        {
          jenisId: jenis.id,
          jenisNama: jenis.nama,
          mode,
          berat,
          hargaBeli: hargaBeliInput,
          modal: berat * hargaBeliDipakai,
        },
      ]);
    } else {
      const hibahKg = Number(lineHibahKg) || 0;
      const dijualKg = Number(lineDijualKg) || 0;
      if (hibahKg <= 0 && dijualKg <= 0) return setLineError("Isi minimal salah satu bagian.");
      if (hargaBeliDipakai < 0) return setLineError("Harga tidak boleh negatif.");
      setItems((prev) => [
        ...prev,
        {
          jenisId: jenis.id,
          jenisNama: jenis.nama,
          mode,
          berat: hibahKg + dijualKg,
          hargaBeli: hargaBeliInput,
          hibahKg,
          dijualKg,
          modal: dijualKg * hargaBeliDipakai,
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
              hargaBeli: i.hargaBeli,
              hibahKg: i.hibahKg,
              dijualKg: i.dijualKg,
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
      <p className="text-sm font-medium mb-3">Tambah setoran warga</p>

      <div className="space-y-4">
        <div>
          <Label htmlFor="warga">Nama warga</Label>
          <Input
            id="warga"
            placeholder="Pak Budi"
            value={warga}
            onChange={(e) => setWarga(e.target.value)}
            required
          />
        </div>

        <div className="rounded-xl border border-line bg-bg p-3">
          <p className="text-xs font-medium text-ink-soft mb-2">Tambah jenis sampah ke daftar</p>

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
          <Select id="line_jenis" value={lineJenisId} onChange={(e) => setLineJenisId(e.target.value)}>
            <option value="" disabled>
              Pilih jenis
            </option>
            {jenisTersedia.map((j) => (
              <option key={j.id} value={j.id}>
                {j.nama}
              </option>
            ))}
          </Select>

          <div className="mt-3">
            <Label>Status</Label>
            <div className="flex gap-1.5">
              {(["HIBAH", "DIJUAL", "SEBAGIAN"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                    mode === m
                      ? "bg-primary text-white border-primary"
                      : "bg-white border-line text-ink-soft hover:bg-primary-soft"
                  }`}
                >
                  {m === "HIBAH" ? "Hibah" : m === "DIJUAL" ? "Dijual" : "Sebagian"}
                </button>
              ))}
            </div>
          </div>

          {mode !== "SEBAGIAN" ? (
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
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
              {mode === "DIJUAL" && (
                <div>
                  <Label htmlFor="line_harga">Harga beli/kg (kosongkan = harga master)</Label>
                  <Input
                    id="line_harga"
                    type="number"
                    min={0}
                    step="1"
                    value={lineHargaBeli}
                    onChange={(e) => setLineHargaBeli(e.target.value)}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              <div>
                <Label htmlFor="line_hibah">Bagian hibah (kg)</Label>
                <Input
                  id="line_hibah"
                  type="number"
                  min={0}
                  step="0.1"
                  value={lineHibahKg}
                  onChange={(e) => setLineHibahKg(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="line_dijual">Bagian dijual (kg)</Label>
                <Input
                  id="line_dijual"
                  type="number"
                  min={0}
                  step="0.1"
                  value={lineDijualKg}
                  onChange={(e) => setLineDijualKg(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="line_harga_sebagian">
                  Harga beli/kg untuk bagian dijual (kosongkan = harga master)
                </Label>
                <Input
                  id="line_harga_sebagian"
                  type="number"
                  min={0}
                  step="1"
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
            className="w-full sm:w-auto mt-3"
            onClick={handleTambahKeDaftar}
          >
            <Plus size={14} /> Tambah ke daftar
          </Button>
          {lineError && <p className="text-xs text-danger mt-2">{lineError}</p>}
        </div>

        {items.length > 0 && (
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div
                key={`${item.jenisId}-${idx}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{item.jenisNama}</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {item.mode === "SEBAGIAN" ? (
                      <>
                        <Badge tone="primary">Hibah {formatKg(item.hibahKg ?? 0)}</Badge>
                        <Badge tone="amber">Dijual {formatKg(item.dijualKg ?? 0)}</Badge>
                      </>
                    ) : (
                      <Badge tone={item.mode === "HIBAH" ? "primary" : "amber"}>
                        {item.mode === "HIBAH" ? "Hibah" : "Dijual"} · {formatKg(item.berat)}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {item.modal > 0 && (
                    <p className="text-sm font-medium">{formatRupiah(item.modal)}</p>
                  )}
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
            ))}

            <div className="flex items-center justify-between rounded-xl bg-primary-soft px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Badge>{items.length} jenis</Badge>
                <span className="text-xs text-primary-ink">{formatKg(totalBerat)}</span>
              </div>
              <p className="font-display font-semibold text-sm text-primary-ink">
                Modal {formatRupiah(totalModal)}
              </p>
            </div>
          </div>
        )}

        <Button type="button" size="lg" className="w-full" loading={pending} onClick={handleSubmit}>
          {pending ? "Menyimpan..." : `Tambah Setoran${items.length > 0 ? ` (${items.length} jenis)` : ""}`}
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
