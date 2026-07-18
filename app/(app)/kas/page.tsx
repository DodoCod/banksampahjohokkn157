import { CardStat, EmptyState, PageHeader, Table, Th, Td } from "@/components/ui/primitives";
import { ConfigNotice } from "@/components/config-notice";
import * as sheets from "@/services/sheets";
import { saldoKasSaatIni } from "@/services/finance";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import { safeLoad } from "@/lib/safe-load";

export const dynamic = "force-dynamic";

export default async function KasPage() {
  const result = await safeLoad(async () => {
    const [kas, penjualan] = await Promise.all([sheets.listKas(), sheets.listPenjualan()]);
    const penjualanMap = new Map(penjualan.map((p) => [p.id, p]));
    const saldo = saldoKasSaatIni(kas);
    return { kas, penjualanMap, saldo };
  });

  if (!result.ok) {
    return (
      <div>
        <PageHeader title="Kas" />
        <ConfigNotice error={result.error} />
      </div>
    );
  }

  const { kas, penjualanMap, saldo } = result.data;

  return (
    <div>
      <PageHeader title="Kas" description="Riwayat kas bertambah otomatis dari laba bersih setiap penjualan." />

      <div className="mb-6 max-w-xs">
        <CardStat label="Saldo Kas Saat Ini" value={formatRupiah(saldo)} accent="danger" />
      </div>

      {kas.length === 0 ? (
        <EmptyState title="Belum ada riwayat kas" description="Kas akan bertambah otomatis setelah ada penjualan." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Tanggal</Th>
              <Th>Pengepul</Th>
              <Th>Pendapatan</Th>
              <Th>Modal</Th>
              <Th>Laba (masuk kas)</Th>
              <Th>Saldo</Th>
            </tr>
          </thead>
          <tbody>
            {kas.map((k) => {
              const p = penjualanMap.get(k.penjualan_id);
              return (
                <tr key={k.id}>
                  <Td>{formatTanggal(k.tanggal)}</Td>
                  <Td>{p?.pengepul ?? "-"}</Td>
                  <Td>{p ? formatRupiah(p.total_pendapatan) : "-"}</Td>
                  <Td>{p ? formatRupiah(p.total_modal) : "-"}</Td>
                  <Td className="font-medium text-primary-ink">{formatRupiah(k.pemasukan)}</Td>
                  <Td className="font-medium">{formatRupiah(k.saldo)}</Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}
