import { PageHeader, CardStat } from "@/components/ui/primitives";
import { ConfigNotice } from "@/components/config-notice";
import { DashboardCharts } from "@/components/dashboard-charts";
import * as sheets from "@/services/sheets";
import { buatDashboardSummary } from "@/services/finance";
import { formatKg, formatRupiah } from "@/lib/utils";
import { safeLoad } from "@/lib/safe-load";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const result = await safeLoad(async () => {
    const [jenisList, pengumpulan, penjualan, kas] = await Promise.all([
      sheets.listJenisSampah(),
      sheets.listPengumpulan(),
      sheets.listPenjualan(),
      sheets.listKas(),
    ]);
    return buatDashboardSummary(jenisList, pengumpulan, penjualan, kas);
  });

  if (!result.ok) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <ConfigNotice error={result.error} />
      </div>
    );
  }

  const summary = result.data;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Ringkasan pengumpulan, stok, penjualan, dan kas Bank Sampah."
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <CardStat label="Total Stok" value={formatKg(summary.totalStokKg)} />
        <CardStat label="Jenis Sampah Aktif" value={String(summary.totalJenisSampah)} />
        <CardStat label="Nilai Modal Stok" value={formatRupiah(summary.totalNilaiModal)} accent="amber" />
        <CardStat label="Total Penjualan" value={formatRupiah(summary.totalPenjualan)} accent="amber" />
        <CardStat label="Saldo Kas" value={formatRupiah(summary.saldoKas)} accent="danger" />
      </div>

      <DashboardCharts data={summary} />
    </div>
  );
}
