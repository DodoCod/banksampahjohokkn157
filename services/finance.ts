import type { DashboardSummary, JenisSampah, Kas, Pengumpulan, Penjualan } from "@/types";
import { ringkasStokPerJenis } from "@/services/stock";

/** Saldo kas saat ini = akumulasi laba bersih seluruh penjualan (PRD bagian 12). */
export function saldoKasSaatIni(kas: Kas[]): number {
  return kas.reduce((sum, k) => sum + k.pemasukan, 0);
}

const BULAN_ID = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

function bulanKey(tanggal: string): string {
  const d = new Date(tanggal);
  if (Number.isNaN(d.getTime())) return "-";
  return `${BULAN_ID[d.getMonth()]} ${d.getFullYear()}`;
}

export function buatDashboardSummary(
  jenisList: JenisSampah[],
  pengumpulan: Pengumpulan[],
  penjualan: Penjualan[],
  kas: Kas[]
): DashboardSummary {
  const stok = ringkasStokPerJenis(jenisList, pengumpulan);
  const totalStokKg = stok.reduce((s, x) => s + x.total_sisa_kg, 0);
  const totalNilaiModal = stok.reduce((s, x) => s + x.total_modal, 0);
  const totalPenjualan = penjualan.reduce((s, p) => s + p.total_pendapatan, 0);

  // Pengumpulan per bulan (total kg masuk, hibah + beli)
  const pengumpulanMap = new Map<string, number>();
  for (const p of pengumpulan) {
    const key = bulanKey(p.created_at);
    pengumpulanMap.set(key, (pengumpulanMap.get(key) ?? 0) + p.berat);
  }

  // Penjualan per bulan (pendapatan + laba)
  const penjualanMap = new Map<string, { pendapatan: number; laba: number }>();
  for (const p of penjualan) {
    const key = bulanKey(p.tanggal);
    const cur = penjualanMap.get(key) ?? { pendapatan: 0, laba: 0 };
    cur.pendapatan += p.total_pendapatan;
    cur.laba += p.laba;
    penjualanMap.set(key, cur);
  }

  // Jenis sampah terbanyak (berdasarkan total kg terkumpul sepanjang waktu)
  const jenisKgMap = new Map<string, number>();
  for (const p of pengumpulan) {
    jenisKgMap.set(p.jenis_id, (jenisKgMap.get(p.jenis_id) ?? 0) + p.berat);
  }
  const jenisTerbanyak = Array.from(jenisKgMap.entries())
    .map(([jenisId, kg]) => ({
      nama: jenisList.find((j) => j.id === jenisId)?.nama ?? "Tidak diketahui",
      kg,
    }))
    .sort((a, b) => b.kg - a.kg)
    .slice(0, 6);

  return {
    totalStokKg,
    totalJenisSampah: jenisList.filter((j) => j.aktif).length,
    totalNilaiModal,
    totalPenjualan,
    saldoKas: saldoKasSaatIni(kas),
    pengumpulanPerBulan: Array.from(pengumpulanMap.entries()).map(([bulan, kg]) => ({
      bulan,
      kg,
    })),
    penjualanPerBulan: Array.from(penjualanMap.entries()).map(([bulan, v]) => ({
      bulan,
      ...v,
    })),
    jenisTerbanyak,
  };
}
