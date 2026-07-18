import type { JenisSampah, Pengumpulan, StokRingkas } from "@/types";

/** Baris pengumpulan yang masih punya sisa stok (sisa_berat > 0), untuk satu jenis sampah. */
export function getStokTersedia(jenisId: string, pengumpulan: Pengumpulan[]): Pengumpulan[] {
  return pengumpulan
    .filter((p) => p.jenis_id === jenisId && p.sisa_berat > 0.0001)
    .sort((a, b) => (a.created_at < b.created_at ? -1 : 1)); // FIFO: masuk duluan, keluar duluan
}

/** Ringkasan stok per jenis sampah, untuk halaman Stok & Dashboard. */
export function ringkasStokPerJenis(
  jenisList: JenisSampah[],
  pengumpulan: Pengumpulan[]
): StokRingkas[] {
  return jenisList
    .map((jenis) => {
      const tersedia = getStokTersedia(jenis.id, pengumpulan);
      const totalSisaKg = tersedia.reduce((sum, p) => sum + p.sisa_berat, 0);
      const totalModal = tersedia.reduce(
        (sum, p) => sum + p.sisa_berat * (p.berat > 0 ? p.modal / p.berat : 0),
        0
      );
      return {
        jenis_id: jenis.id,
        jenis_nama: jenis.nama,
        total_sisa_kg: totalSisaKg,
        total_modal: totalModal,
        modal_per_kg: totalSisaKg > 0 ? totalModal / totalSisaKg : 0,
      };
    })
    .filter((s) => s.total_sisa_kg > 0.0001);
}

export interface FifoPemakaian {
  pengumpulan_id: string;
  berat: number;
  modal: number;
}

export interface FifoResult {
  cukup: boolean;
  totalTerambil: number;
  totalModal: number;
  pemakaian: FifoPemakaian[];
  kekurangan: number; // > 0 jika stok tidak cukup
}

/**
 * Ambil stok sejumlah `kgDibutuhkan` dari jenis sampah tertentu menggunakan
 * metode FIFO (batch yang lebih dulu masuk dipakai lebih dulu).
 *
 * Fungsi ini murni kalkulasi (tidak menulis ke spreadsheet). Hasilnya lalu
 * dipakai oleh server action untuk meng-update sisa_berat setiap baris
 * Pengumpulan yang terpakai, dan mencatat DetailPenjualan.
 */
export function hitungFifo(
  jenisId: string,
  kgDibutuhkan: number,
  pengumpulan: Pengumpulan[]
): FifoResult {
  const tersedia = getStokTersedia(jenisId, pengumpulan);

  let sisaDibutuhkan = kgDibutuhkan;
  const pemakaian: FifoPemakaian[] = [];

  for (const batchStok of tersedia) {
    if (sisaDibutuhkan <= 0.0001) break;
    const modalPerKg = batchStok.berat > 0 ? batchStok.modal / batchStok.berat : 0;
    const ambil = Math.min(batchStok.sisa_berat, sisaDibutuhkan);
    if (ambil <= 0) continue;

    pemakaian.push({
      pengumpulan_id: batchStok.id,
      berat: ambil,
      modal: ambil * modalPerKg,
    });
    sisaDibutuhkan -= ambil;
  }

  const totalTerambil = pemakaian.reduce((sum, p) => sum + p.berat, 0);
  const totalModal = pemakaian.reduce((sum, p) => sum + p.modal, 0);

  return {
    cukup: sisaDibutuhkan <= 0.0001,
    totalTerambil,
    totalModal,
    pemakaian,
    kekurangan: Math.max(0, sisaDibutuhkan),
  };
}
