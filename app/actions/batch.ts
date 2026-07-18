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

/**
 * Tambah satu setoran warga ke sebuah batch. Menangani 3 mode sesuai PRD bagian 5:
 * HIBAH, DIJUAL, atau SEBAGIAN (dipecah menjadi 2 baris: HIBAH + BELI).
 */
export async function addSetoranAction(formData: FormData) {
  const batch_id = String(formData.get("batch_id") ?? "");
  const warga = String(formData.get("warga") ?? "").trim();
  const jenis_id = String(formData.get("jenis_id") ?? "");
  const mode = String(formData.get("mode") ?? "HIBAH") as "HIBAH" | "DIJUAL" | "SEBAGIAN";
  const berat = Number(formData.get("berat") ?? 0);
  const hibah_kg = Number(formData.get("hibah_kg") ?? 0);
  const dijual_kg = Number(formData.get("dijual_kg") ?? 0);
  const hargaOverride = formData.get("harga_beli");

  if (!batch_id) throw new Error("Batch tidak ditemukan.");
  if (!warga) throw new Error("Nama warga wajib diisi.");
  if (!jenis_id) throw new Error("Jenis sampah wajib dipilih.");

  const jenisList = await sheets.listJenisSampah();
  const jenis = jenisList.find((j) => j.id === jenis_id);
  if (!jenis) throw new Error("Jenis sampah tidak valid.");

  const hargaBeli =
    hargaOverride && String(hargaOverride) !== "" ? Number(hargaOverride) : jenis.harga_beli;

  if (mode === "HIBAH") {
    if (berat <= 0) throw new Error("Berat harus lebih dari nol.");
    await sheets.createPengumpulanRows([
      {
        batch_id,
        warga,
        jenis_id,
        berat,
        tipe: "HIBAH",
        harga_beli: 0,
        modal: 0,
        sisa_berat: berat,
      },
    ]);
  } else if (mode === "DIJUAL") {
    if (berat <= 0) throw new Error("Berat harus lebih dari nol.");
    if (hargaBeli < 0) throw new Error("Harga tidak boleh negatif.");
    await sheets.createPengumpulanRows([
      {
        batch_id,
        warga,
        jenis_id,
        berat,
        tipe: "BELI",
        harga_beli: hargaBeli,
        modal: berat * hargaBeli,
        sisa_berat: berat,
      },
    ]);
  } else {
    // SEBAGIAN: dipecah menjadi 2 baris terpisah (PRD bagian 5 & catatan implementasi)
    if (hibah_kg < 0 || dijual_kg < 0) throw new Error("Berat harus lebih dari nol.");
    if (Math.abs(hibah_kg + dijual_kg - berat) > 0.001) {
      throw new Error("Total hibah + dijual harus sama dengan total berat setoran.");
    }
    const rows = [];
    if (hibah_kg > 0) {
      rows.push({
        batch_id,
        warga,
        jenis_id,
        berat: hibah_kg,
        tipe: "HIBAH" as const,
        harga_beli: 0,
        modal: 0,
        sisa_berat: hibah_kg,
      });
    }
    if (dijual_kg > 0) {
      rows.push({
        batch_id,
        warga,
        jenis_id,
        berat: dijual_kg,
        tipe: "BELI" as const,
        harga_beli: hargaBeli,
        modal: dijual_kg * hargaBeli,
        sisa_berat: dijual_kg,
      });
    }
    if (rows.length === 0) throw new Error("Berat harus lebih dari nol.");
    await sheets.createPengumpulanRows(rows);
  }

  revalidatePath(`/batch/${batch_id}`);
  revalidatePath("/stok");
  revalidatePath("/dashboard");
}
