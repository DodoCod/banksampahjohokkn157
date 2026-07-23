"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as sheets from "@/services/sheets";

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

  if (await sheets.isBatchSudahDijual(id)) {
    throw new Error("Tidak bisa menghapus batch yang sudah pernah dijual.");
  }

  await sheets.deleteBatch(id);
  revalidatePath("/batch");
  redirect("/batch");
}

/**
 * Tambah beberapa setoran sekaligus untuk satu warga dalam satu kali submit
 * (model "keranjang", sama seperti halaman Penjualan). Tiap jenis sampah
 * tetap dicatat sebagai baris Pengumpulan-nya sendiri dengan id masing-masing
 * — keranjang ini cuma menyatukan pengiriman form-nya, bukan datanya.
 *
 * Tiap item mendukung 3 mode sesuai PRD bagian 5: HIBAH, DIJUAL, atau
 * SEBAGIAN (dipecah menjadi 2 baris: HIBAH + BELI).
 */
export async function addSetoranBatchAction(formData: FormData) {
  const batch_id = String(formData.get("batch_id") ?? "");
  const warga = String(formData.get("warga") ?? "").trim();
  const itemsRaw = String(formData.get("items") ?? "[]");

  if (!batch_id) throw new Error("Batch tidak ditemukan.");
  if (!warga) throw new Error("Nama warga wajib diisi.");

  if (await sheets.isBatchSudahDijual(batch_id)) {
    throw new Error(
      "Batch ini sudah punya sampah yang terjual ke pengepul, jadi tidak bisa ditambah setoran baru lagi."
    );
  }

  interface SetoranItemPayload {
    jenisId: string;
    mode: "HIBAH" | "DIJUAL" | "SEBAGIAN";
    berat: number;
    hargaBeli?: number;
    hibahKg?: number;
    dijualKg?: number;
  }

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

  const rows: {
    batch_id: string;
    warga: string;
    jenis_id: string;
    berat: number;
    tipe: "HIBAH" | "BELI";
    harga_beli: number;
    modal: number;
    sisa_berat: number;
  }[] = [];

  for (const item of items) {
    const jenis = jenisMap.get(item.jenisId);
    if (!jenis) throw new Error("Salah satu jenis sampah pada daftar tidak valid.");

    const hargaBeli =
      item.hargaBeli !== undefined && item.hargaBeli !== null ? item.hargaBeli : jenis.harga_beli;

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
      if (hibahKg < 0 || dijualKg < 0) throw new Error("Berat harus lebih dari nol.");
      if (hibahKg === 0 && dijualKg === 0) {
        throw new Error(`Berat untuk ${jenis.nama} harus lebih dari nol.`);
      }
      if (Math.abs(hibahKg + dijualKg - item.berat) > 0.001) {
        throw new Error(`Total hibah + dijual untuk ${jenis.nama} harus sama dengan total berat.`);
      }
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

  await sheets.createPengumpulanRows(rows);

  revalidatePath(`/batch/${batch_id}`);
  revalidatePath("/stok");
  revalidatePath("/dashboard");
}
