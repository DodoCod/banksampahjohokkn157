import {
  SHEET_NAMES,
  appendRow,
  deleteRowById,
  readSheet,
  updatePartialById,
  updateRowById,
} from "@/lib/sheets-client";
import { genId } from "@/lib/utils";
import type {
  Batch,
  DetailPenjualan,
  JenisSampah,
  Kas,
  Pengumpulan,
  Penjualan,
} from "@/types";

// Toleran terhadap sisa data lama yang sempat tersimpan dengan koma sebagai
// pemisah desimal (mis. "2,2") akibat isu format locale Google Sheets yang
// sudah diperbaiki di lib/sheets-client.ts. Kalau ada koma tapi tidak ada
// titik, anggap koma itu pemisah desimal.
const num = (v: string | undefined) => {
  if (!v) return 0;
  const normalized = v.includes(",") && !v.includes(".") ? v.replace(",", ".") : v;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};
const bool = (v: string | undefined) => v === "true" || v === "TRUE" || v === "1";

// ---------------- JenisSampah ----------------

export async function listJenisSampah(): Promise<JenisSampah[]> {
  const rows = await readSheet(SHEET_NAMES.JenisSampah);
  return rows.map((r) => ({
    id: r.id,
    nama: r.nama,
    harga_beli: num(r.harga_beli),
    satuan: r.satuan || "kg",
    aktif: bool(r.aktif),
  }));
}

export async function createJenisSampah(input: Omit<JenisSampah, "id">): Promise<JenisSampah> {
  const item: JenisSampah = { id: genId("jenis"), ...input };
  await appendRow(SHEET_NAMES.JenisSampah, [
    item.id,
    item.nama,
    item.harga_beli,
    item.satuan,
    String(item.aktif),
  ]);
  return item;
}

export async function updateJenisSampah(item: JenisSampah): Promise<void> {
  await updateRowById(SHEET_NAMES.JenisSampah, item.id, [
    item.id,
    item.nama,
    item.harga_beli,
    item.satuan,
    String(item.aktif),
  ]);
}

export async function deleteJenisSampah(id: string): Promise<void> {
  await deleteRowById(SHEET_NAMES.JenisSampah, id);
}

// ---------------- Batch ----------------

export async function listBatch(): Promise<Batch[]> {
  const rows = await readSheet(SHEET_NAMES.Batch);
  return rows
    .map((r) => ({ id: r.id, tanggal: r.tanggal, keterangan: r.keterangan }))
    .sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1));
}

export async function getBatch(id: string): Promise<Batch | null> {
  const rows = await listBatch();
  return rows.find((b) => b.id === id) ?? null;
}

export async function createBatch(input: Omit<Batch, "id">): Promise<Batch> {
  const item: Batch = { id: genId("batch"), ...input };
  await appendRow(SHEET_NAMES.Batch, [item.id, item.tanggal, item.keterangan]);
  return item;
}

export async function deleteBatch(id: string): Promise<void> {
  await deleteRowById(SHEET_NAMES.Batch, id);
}

// ---------------- Pengumpulan ----------------

export async function listPengumpulan(): Promise<Pengumpulan[]> {
  const rows = await readSheet(SHEET_NAMES.Pengumpulan);
  return rows.map((r) => ({
    id: r.id,
    batch_id: r.batch_id,
    warga: r.warga,
    jenis_id: r.jenis_id,
    berat: num(r.berat),
    tipe: (r.tipe as "HIBAH" | "BELI") || "HIBAH",
    harga_beli: num(r.harga_beli),
    modal: num(r.modal),
    sisa_berat: num(r.sisa_berat),
    created_at: r.created_at,
  }));
}

export async function listPengumpulanByBatch(batchId: string): Promise<Pengumpulan[]> {
  const rows = await listPengumpulan();
  return rows.filter((p) => p.batch_id === batchId);
}

/**
 * true jika minimal 1 baris Pengumpulan pada batch ini sudah pernah terjual
 * (muncul di DetailPenjualan). Dipakai untuk mengunci batch: tidak boleh
 * dihapus, dan tidak boleh ditambah setoran baru lagi.
 */
export async function isBatchSudahDijual(batchId: string): Promise<boolean> {
  const [pengumpulanBatch, detail] = await Promise.all([
    listPengumpulanByBatch(batchId),
    listDetailPenjualan(),
  ]);
  const idsPengumpulan = new Set(pengumpulanBatch.map((p) => p.id));
  return detail.some((d) => idsPengumpulan.has(d.pengumpulan_id));
}

export async function createPengumpulanRows(
  rows: Omit<Pengumpulan, "id" | "created_at">[]
): Promise<Pengumpulan[]> {
  const now = new Date().toISOString();
  const items: Pengumpulan[] = rows.map((r) => ({ id: genId("pgp"), created_at: now, ...r }));
  for (const item of items) {
    await appendRow(SHEET_NAMES.Pengumpulan, [
      item.id,
      item.batch_id,
      item.warga,
      item.jenis_id,
      item.berat,
      item.tipe,
      item.harga_beli,
      item.modal,
      item.sisa_berat,
      item.created_at,
    ]);
  }
  return items;
}

export async function updateSisaBerat(id: string, sisaBerat: number): Promise<void> {
  await updatePartialById(SHEET_NAMES.Pengumpulan, id, { sisa_berat: sisaBerat });
}

// ---------------- Penjualan ----------------

export async function listPenjualan(): Promise<Penjualan[]> {
  const rows = await readSheet(SHEET_NAMES.Penjualan);
  return rows
    .map((r) => ({
      id: r.id,
      tanggal: r.tanggal,
      pengepul: r.pengepul,
      jenis_ids: r.jenis_ids,
      total_kg: num(r.total_kg),
      total_modal: num(r.total_modal),
      total_pendapatan: num(r.total_pendapatan),
      laba: num(r.laba),
    }))
    .sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1));
}

export async function createPenjualan(item: Omit<Penjualan, "id">): Promise<Penjualan> {
  const full: Penjualan = { id: genId("jual"), ...item };
  await appendRow(SHEET_NAMES.Penjualan, [
    full.id,
    full.tanggal,
    full.pengepul,
    full.jenis_ids,
    full.total_kg,
    full.total_modal,
    full.total_pendapatan,
    full.laba,
  ]);
  return full;
}

// ---------------- DetailPenjualan ----------------

export async function listDetailPenjualan(): Promise<DetailPenjualan[]> {
  const rows = await readSheet(SHEET_NAMES.DetailPenjualan);
  return rows.map((r) => ({
    id: r.id,
    penjualan_id: r.penjualan_id,
    pengumpulan_id: r.pengumpulan_id,
    berat: num(r.berat),
    modal: num(r.modal),
  }));
}

export async function createDetailPenjualanRows(
  rows: Omit<DetailPenjualan, "id">[]
): Promise<DetailPenjualan[]> {
  const items: DetailPenjualan[] = rows.map((r) => ({ id: genId("dtl"), ...r }));
  for (const item of items) {
    await appendRow(SHEET_NAMES.DetailPenjualan, [
      item.id,
      item.penjualan_id,
      item.pengumpulan_id,
      item.berat,
      item.modal,
    ]);
  }
  return items;
}

// ---------------- Kas ----------------

export async function listKas(): Promise<Kas[]> {
  const rows = await readSheet(SHEET_NAMES.Kas);
  return rows
    .map((r) => ({
      id: r.id,
      tanggal: r.tanggal,
      penjualan_id: r.penjualan_id,
      pemasukan: num(r.pemasukan),
      saldo: num(r.saldo),
    }))
    .sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1));
}

export async function createKasEntry(
  tanggal: string,
  penjualanId: string,
  pemasukan: number
): Promise<Kas> {
  const rows = await readSheet(SHEET_NAMES.Kas);
  const saldoSebelumnya = rows.reduce((sum, r) => sum + num(r.pemasukan), 0);
  const item: Kas = {
    id: genId("kas"),
    tanggal,
    penjualan_id: penjualanId,
    pemasukan,
    saldo: saldoSebelumnya + pemasukan,
  };
  await appendRow(SHEET_NAMES.Kas, [
    item.id,
    item.tanggal,
    item.penjualan_id,
    item.pemasukan,
    item.saldo,
  ]);
  return item;
}
