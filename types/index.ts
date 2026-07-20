// Tipe data inti aplikasi Bank Sampah Karang Taruna
// Mengikuti struktur sheet pada PRD bagian 15.

export type TipePengumpulan = "HIBAH" | "BELI";

export interface JenisSampah {
  id: string;
  nama: string;
  harga_beli: number; // harga beli standar per kg (bisa berubah, dipakai sbg default)
  satuan: string; // biasanya "kg"
  aktif: boolean;
}

export interface Batch {
  id: string;
  tanggal: string; // ISO date (yyyy-mm-dd)
  keterangan: string;
}

export interface Pengumpulan {
  id: string;
  batch_id: string;
  warga: string;
  jenis_id: string;
  berat: number; // kg pada baris ini
  tipe: TipePengumpulan;
  harga_beli: number; // snapshot harga saat transaksi dibuat (0 jika HIBAH)
  modal: number; // berat * harga_beli
  sisa_berat: number; // stok tersisa dari baris ini (berkurang oleh FIFO penjualan)
  created_at: string; // ISO datetime
}

export interface Penjualan {
  id: string;
  tanggal: string;
  pengepul: string;
  jenis_ids: string; // daftar id jenis sampah yang terjual, dipisah koma (bisa lebih dari 1 jenis per transaksi)
  total_kg: number;
  total_modal: number;
  total_pendapatan: number;
  laba: number;
}

export interface DetailPenjualan {
  id: string;
  penjualan_id: string;
  pengumpulan_id: string;
  berat: number; // kg yang diambil dari baris pengumpulan ini
  modal: number; // modal yang berasal dari baris ini (berat * harga_beli snapshot)
}

export interface Kas {
  id: string;
  tanggal: string;
  penjualan_id: string;
  pemasukan: number; // = laba penjualan terkait
  saldo: number; // saldo kumulatif setelah transaksi ini
}

// ---- Tipe bantuan untuk UI / form ----

export interface WargaSetoranInput {
  warga: string;
  jenis_id: string;
  berat: number;
  mode: "HIBAH" | "DIJUAL" | "SEBAGIAN";
  hibah_kg?: number; // hanya untuk mode SEBAGIAN
  dijual_kg?: number; // hanya untuk mode SEBAGIAN
  harga_beli?: number; // override harga beli, default ke harga master jenis sampah
}

export interface PenjualanItemInput {
  jenisId: string;
  jenisNama: string;
  berat: number; // berat hasil timbangan pengepul (dasar hitung pendapatan)
  totalHarga: number;
  jualHabis: boolean; // true = stok jenis ini dianggap habis terjual (menampung selisih timbangan)
  stokSaatDitambahkan?: number; // snapshot sisa stok saat item ditambahkan, hanya untuk info di UI
}

export interface StokRingkas {
  jenis_id: string;
  jenis_nama: string;
  total_sisa_kg: number;
  total_modal: number; // modal dari sisa stok saja
  modal_per_kg: number;
}

export interface DashboardSummary {
  totalStokKg: number;
  totalJenisSampah: number;
  totalNilaiModal: number;
  totalPenjualan: number;
  saldoKas: number;
  pengumpulanPerBulan: { bulan: string; kg: number }[];
  penjualanPerBulan: { bulan: string; pendapatan: number; laba: number }[];
  jenisTerbanyak: { nama: string; kg: number }[];
}
