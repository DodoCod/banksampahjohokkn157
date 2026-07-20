"use server";

import { revalidatePath } from "next/cache";
import * as sheets from "@/services/sheets";
import { hitungFifo } from "@/services/stock";
import type { Pengumpulan } from "@/types";

interface PenjualanItemPayload {
  jenisId: string;
  berat: number;
  totalHarga: number;
}

/**
 * Buat transaksi penjualan baru. Mendukung lebih dari 1 jenis sampah dalam
 * satu transaksi (misal jual Botol Plastik + Kaleng sekaligus ke pengepul
 * yang sama) — dikirim sebagai daftar item lewat field `items` (JSON).
 *
 * Urutan operasi (lihat catatan atomisitas di README):
 *  1. Hitung pemakaian stok FIFO per item secara berurutan, memakai salinan
 *     kerja dari data stok supaya item ke-2 dst. tidak memakai batch yang
 *     baru saja "dipakai" oleh item sebelumnya dalam transaksi yang sama.
 *  2. Tolak seluruh transaksi jika ada satu item saja yang stoknya tidak cukup
 *     (tidak ada penulisan apa pun terjadi).
 *  3. Tulis SATU baris Penjualan untuk keseluruhan transaksi (jenis_ids berisi
 *     daftar id jenis yang terjual, dipisah koma).
 *  4. Tulis baris DetailPenjualan untuk setiap batch stok yang terpakai, dari
 *     semua item.
 *  5. Update sisa_berat pada tiap baris Pengumpulan yang terpakai (diagregasi
 *     dulu per baris, supaya baris yang sama yang dipakai lebih dari satu
 *     item tetap konsisten).
 *  6. Tambah SATU entri Kas sebesar total laba bersih transaksi ini.
 */
export async function createPenjualanAction(formData: FormData) {
  const tanggal = String(formData.get("tanggal") ?? "");
  const pengepul = String(formData.get("pengepul") ?? "").trim();
  const itemsRaw = String(formData.get("items") ?? "[]");

  if (!tanggal) throw new Error("Tanggal wajib diisi.");
  if (!pengepul) throw new Error("Nama pengepul wajib diisi.");

  let items: PenjualanItemPayload[];
  try {
    items = JSON.parse(itemsRaw);
  } catch {
    throw new Error("Data item penjualan tidak valid.");
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Tambahkan minimal 1 jenis sampah ke daftar penjualan.");
  }

  const jenisList = await sheets.listJenisSampah();
  const jenisMap = new Map(jenisList.map((j) => [j.id, j]));

  const pengumpulanAsli = await sheets.listPengumpulan();
  // Salinan kerja: sisa_berat di sini berkurang tiap item diproses, supaya
  // FIFO antar-item dalam transaksi yang sama tetap konsisten.
  const working: Pengumpulan[] = pengumpulanAsli.map((p) => ({ ...p }));

  let totalKg = 0;
  let totalModal = 0;
  let totalPendapatan = 0;
  const semuaPemakaian: { pengumpulan_id: string; berat: number; modal: number }[] = [];
  const jenisIdsTerjual: string[] = [];

  for (const item of items) {
    const jenis = jenisMap.get(item.jenisId);
    if (!jenis) throw new Error("Salah satu jenis sampah pada daftar tidak valid.");
    if (!item.berat || item.berat <= 0) {
      throw new Error(`Berat untuk ${jenis.nama} harus lebih dari nol.`);
    }
    if (item.totalHarga < 0) throw new Error("Harga tidak boleh negatif.");

    const fifo = hitungFifo(item.jenisId, item.berat, working);
    if (!fifo.cukup) {
      throw new Error(
        `Stok ${jenis.nama} tidak cukup. Kekurangan ${fifo.kekurangan.toFixed(2)} kg.`
      );
    }

    for (const pakai of fifo.pemakaian) {
      const idx = working.findIndex((p) => p.id === pakai.pengumpulan_id);
      if (idx !== -1) {
        working[idx] = { ...working[idx], sisa_berat: working[idx].sisa_berat - pakai.berat };
      }
    }

    semuaPemakaian.push(...fifo.pemakaian);
    totalKg += fifo.totalTerambil;
    totalModal += fifo.totalModal;
    totalPendapatan += item.totalHarga;
    if (!jenisIdsTerjual.includes(item.jenisId)) jenisIdsTerjual.push(item.jenisId);
  }

  const laba = totalPendapatan - totalModal;

  const penjualan = await sheets.createPenjualan({
    tanggal,
    pengepul,
    jenis_ids: jenisIdsTerjual.join(","),
    total_kg: totalKg,
    total_modal: totalModal,
    total_pendapatan: totalPendapatan,
    laba,
  });

  await sheets.createDetailPenjualanRows(
    semuaPemakaian.map((p) => ({
      penjualan_id: penjualan.id,
      pengumpulan_id: p.pengumpulan_id,
      berat: p.berat,
      modal: p.modal,
    }))
  );

  // Agregasi dulu per baris pengumpulan (bisa saja 1 baris terpakai oleh
  // lebih dari 1 item bila urutan FIFO menyambung antar item jenis yang sama).
  const konsumsiPerBaris = new Map<string, number>();
  for (const pakai of semuaPemakaian) {
    konsumsiPerBaris.set(pakai.pengumpulan_id, (konsumsiPerBaris.get(pakai.pengumpulan_id) ?? 0) + pakai.berat);
  }
  for (const [id, konsumsi] of konsumsiPerBaris) {
    const asli = pengumpulanAsli.find((p) => p.id === id);
    if (!asli) continue;
    await sheets.updateSisaBerat(id, Math.max(0, asli.sisa_berat - konsumsi));
  }

  await sheets.createKasEntry(tanggal, penjualan.id, laba);

  revalidatePath("/penjualan");
  revalidatePath("/stok");
  revalidatePath("/kas");
  revalidatePath("/dashboard");
}
