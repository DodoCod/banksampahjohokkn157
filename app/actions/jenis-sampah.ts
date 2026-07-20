"use server";

import { revalidatePath } from "next/cache";
import * as sheets from "@/services/sheets";
import type { JenisSampah } from "@/types";

export async function createJenisSampahAction(formData: FormData): Promise<JenisSampah> {
  const nama = String(formData.get("nama") ?? "").trim();
  const harga_beli = Number(formData.get("harga_beli") ?? 0);
  const satuan = String(formData.get("satuan") ?? "kg").trim() || "kg";

  if (!nama) throw new Error("Nama jenis sampah wajib diisi.");
  if (harga_beli < 0) throw new Error("Harga tidak boleh negatif.");

  const item = await sheets.createJenisSampah({ nama, harga_beli, satuan, aktif: true });
  revalidatePath("/jenis-sampah");
  revalidatePath("/batch");
  return item;
}

export async function updateJenisSampahAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const nama = String(formData.get("nama") ?? "").trim();
  const harga_beli = Number(formData.get("harga_beli") ?? 0);
  const satuan = String(formData.get("satuan") ?? "kg").trim() || "kg";
  const aktif = formData.get("aktif") === "on";

  if (!id) throw new Error("ID tidak ditemukan.");
  if (!nama) throw new Error("Nama jenis sampah wajib diisi.");
  if (harga_beli < 0) throw new Error("Harga tidak boleh negatif.");

  await sheets.updateJenisSampah({ id, nama, harga_beli, satuan, aktif });
  revalidatePath("/jenis-sampah");
}

export async function deleteJenisSampahAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("ID tidak ditemukan.");

  const pengumpulan = await sheets.listPengumpulan();
  const masihPunyaStok = pengumpulan.some((p) => p.jenis_id === id && p.sisa_berat > 0.0001);
  if (masihPunyaStok) {
    throw new Error("Tidak bisa menghapus jenis sampah yang masih memiliki stok.");
  }

  await sheets.deleteJenisSampah(id);
  revalidatePath("/jenis-sampah");
}