"use server";

import { revalidatePath } from "next/cache";
import * as sheets from "@/services/sheets";
import { hitungFifo } from "@/services/stock";

/**
 * Buat transaksi penjualan baru.
 *
 * Urutan operasi (lihat catatan atomisitas di README):
 *  1. Hitung pemakaian stok FIFO dari baris-baris Pengumpulan yang tersedia.
 *  2. Tolak jika stok tidak cukup (tidak ada penulisan apa pun terjadi).
 *  3. Tulis baris Penjualan.
 *  4. Tulis baris DetailPenjualan untuk tiap batch stok yang terpakai.
 *  5. Update sisa_berat pada tiap baris Pengumpulan yang terpakai.
 *  6. Tambah entri Kas sebesar laba bersih (pendapatan - modal).
 */
export async function createPenjualanAction(formData: FormData) {
  const tanggal = String(formData.get("tanggal") ?? "");
  const pengepul = String(formData.get("pengepul") ?? "").trim();
  const jenis_id = String(formData.get("jenis_id") ?? "");
  const total_kg = Number(formData.get("total_kg") ?? 0);
  const hargaJualPerKg = formData.get("harga_jual_per_kg");
  const totalPendapatanInput = formData.get("total_pendapatan");

  if (!tanggal) throw new Error("Tanggal wajib diisi.");
  if (!pengepul) throw new Error("Nama pengepul wajib diisi.");
  if (!jenis_id) throw new Error("Jenis sampah wajib dipilih.");
  if (total_kg <= 0) throw new Error("Berat harus lebih dari nol.");

  let total_pendapatan: number;
  if (totalPendapatanInput && String(totalPendapatanInput) !== "") {
    total_pendapatan = Number(totalPendapatanInput);
  } else if (hargaJualPerKg && String(hargaJualPerKg) !== "") {
    total_pendapatan = Number(hargaJualPerKg) * total_kg;
  } else {
    throw new Error("Isi harga jual per kg atau total harga jual.");
  }
  if (total_pendapatan < 0) throw new Error("Harga tidak boleh negatif.");

  const pengumpulan = await sheets.listPengumpulan();
  const fifo = hitungFifo(jenis_id, total_kg, pengumpulan);

  if (!fifo.cukup) {
    throw new Error(
      `Stok tidak cukup. Kekurangan ${fifo.kekurangan.toFixed(2)} kg dari stok yang tersedia.`
    );
  }

  const laba = total_pendapatan - fifo.totalModal;

  const penjualan = await sheets.createPenjualan({
    tanggal,
    pengepul,
    jenis_id,
    total_kg: fifo.totalTerambil,
    total_modal: fifo.totalModal,
    total_pendapatan,
    laba,
  });

  await sheets.createDetailPenjualanRows(
    fifo.pemakaian.map((p) => ({
      penjualan_id: penjualan.id,
      pengumpulan_id: p.pengumpulan_id,
      berat: p.berat,
      modal: p.modal,
    }))
  );

  for (const pakai of fifo.pemakaian) {
    const baris = pengumpulan.find((p) => p.id === pakai.pengumpulan_id);
    if (!baris) continue;
    const sisaBaru = baris.sisa_berat - pakai.berat;
    await sheets.updateSisaBerat(baris.id, Math.max(0, sisaBaru));
  }

  await sheets.createKasEntry(tanggal, penjualan.id, laba);

  revalidatePath("/penjualan");
  revalidatePath("/stok");
  revalidatePath("/kas");
  revalidatePath("/dashboard");
}
