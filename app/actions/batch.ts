"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as sheets from "@/services/sheets";
import type { Pengumpulan } from "@/types";

export async function createBatchAction(formData: FormData) {
  const tanggal = String(formData.get("tanggal") ?? "");
  const keterangan = String(formData.get("keterangan") ?? "").trim();
  if (!tanggal) throw new Error("Tanggal wajib diisi.");

  const batch = await sheets.createBatch({ tanggal, keterangan });
  revalidatePath("/batch");
  redirect(`/batch/${batch.id}`);
}

export async function deleteBatchAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("ID tidak ditemukan.");

  const pengumpulan = await sheets.listPengumpulanByBatch(id);
  const detail = await sheets.listDetailPenjualan();
  const idsPengumpulan = new Set(pengumpulan.map((p) => p.id));
  const sudahDijual = detail.some((d) => idsPengumpulan.has(d.pengumpulan_id));

  if (sudahDijual) {
    throw new Error("Tidak bisa menghapus batch yang sudah pernah dijual.");
  }

  await sheets.deleteBatch(id);
  revalidatePath("/batch");
  redirect("/batch");
}

interface SetoranItemPayload {
  jenisId: string;
  mode: "HIBAH" | "DIJUAL" | "SEBAGIAN";
  berat: number;
  hibahKg?: number;
  dijualKg?: number;
  hargaBeli?: number;
}

/**
 * Tambah setoran satu warga sekaligus untuk beberapa jenis sampah — mengikuti
 * pola yang sama dengan model Penjualan (kumpulkan dulu jadi daftar/keranjang
 * di form untuk satu warga, baru kirim semua sekaligus dalam satu submit).
 * Warga hanya diisi sekali (mirip `pengepul` di Penjualan), lalu jenis sampah
 * bisa ditambahkan berkali-kali ke keranjang untuk warga yang sama.
 *
 * Bedanya dengan Penjualan: setiap item TIDAK digabung jadi satu baris.
 * Tiap item (per jenis sampah) tetap ditulis sebagai baris Pengumpulan-nya
 * sendiri dengan id yang berbeda, karena stok FIFO & sisa per baris harus
 * dilacak terpisah. Mode SEBAGIAN pada satu item tetap dipecah lagi menjadi
 * 2 baris: HIBAH + BELI (PRD bagian 5).
 */
export async function addSetoranBatchAction(formData: FormData) {
  const batch_id = String(formData.get("batch_id") ?? "");
  const warga = String(formData.get("warga") ?? "").trim();
  const itemsRaw = String(formData.get("items") ?? "[]");

  if (!batch_id) throw new Error("Batch tidak ditemukan.");
  if (!warga) throw new Error("Nama warga wajib diisi.");

  let items: SetoranItemPayload[];
  try {
    items = JSON.parse(itemsRaw);
  } catch {
    throw new Error("Data setoran tidak valid.");
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Tambahkan minimal 1 jenis sampah ke daftar setoran.");
  }

  const jenisList = await sheets.listJenisSampah();
  const jenisMap = new Map(jenisList.map((j) => [j.id, j]));

  const rows: Omit<Pengumpulan, "id" | "created_at">[] = [];

  for (const item of items) {
    const jenis = jenisMap.get(item.jenisId);
    if (!jenis) throw new Error("Salah satu jenis sampah pada daftar tidak valid.");

    const hargaBeli =
      item.hargaBeli !== undefined && item.hargaBeli !== null && !Number.isNaN(item.hargaBeli)
        ? item.hargaBeli
        : jenis.harga_beli;

    if (item.mode === "HIBAH") {
      if (!item.berat || item.berat <= 0) {
        throw new Error(`Berat untuk ${jenis.nama} harus lebih dari nol.`);
      }
      rows.push({
        batch_id,
        warga,
        jenis_id: item.jenisId,
        berat: item.berat,
        tipe: "HIBAH",
        harga_beli: 0,
        modal: 0,
        sisa_berat: item.berat,
      });
    } else if (item.mode === "DIJUAL") {
      if (!item.berat || item.berat <= 0) {
        throw new Error(`Berat untuk ${jenis.nama} harus lebih dari nol.`);
      }
      if (hargaBeli < 0) throw new Error("Harga tidak boleh negatif.");
      rows.push({
        batch_id,
        warga,
        jenis_id: item.jenisId,
        berat: item.berat,
        tipe: "BELI",
        harga_beli: hargaBeli,
        modal: item.berat * hargaBeli,
        sisa_berat: item.berat,
      });
    } else {
      // SEBAGIAN: dipecah menjadi 2 baris terpisah (PRD bagian 5 & catatan implementasi)
      const hibahKg = item.hibahKg ?? 0;
      const dijualKg = item.dijualKg ?? 0;
      if (hibahKg < 0 || dijualKg < 0) {
        throw new Error(`Berat untuk ${jenis.nama} harus lebih dari nol.`);
      }
      if (Math.abs(hibahKg + dijualKg - item.berat) > 0.001) {
        throw new Error(`Total hibah + dijual untuk ${jenis.nama} harus sama dengan total berat setoran.`);
      }
      if (hargaBeli < 0) throw new Error("Harga tidak boleh negatif.");
      if (hibahKg > 0) {
        rows.push({
          batch_id,
          warga,
          jenis_id: item.jenisId,
          berat: hibahKg,
          tipe: "HIBAH",
          harga_beli: 0,
          modal: 0,
          sisa_berat: hibahKg,
        });
      }
      if (dijualKg > 0) {
        rows.push({
          batch_id,
          warga,
          jenis_id: item.jenisId,
          berat: dijualKg,
          tipe: "BELI",
          harga_beli: hargaBeli,
          modal: dijualKg * hargaBeli,
          sisa_berat: dijualKg,
        });
      }
    }
  }

  if (rows.length === 0) throw new Error("Tidak ada setoran valid untuk disimpan.");

  await sheets.createPengumpulanRows(rows);

  revalidatePath(`/batch/${batch_id}`);
  revalidatePath("/stok");
  revalidatePath("/dashboard");
}