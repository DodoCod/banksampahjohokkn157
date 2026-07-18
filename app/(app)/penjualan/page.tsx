import { EmptyState, PageHeader, Table, Th, Td } from "@/components/ui/primitives";
import { ConfigNotice } from "@/components/config-notice";
import { PenjualanForm } from "@/components/penjualan-form";
import * as sheets from "@/services/sheets";
import { ringkasStokPerJenis } from "@/services/stock";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import { safeLoad } from "@/lib/safe-load";

export const dynamic = "force-dynamic";

export default async function PenjualanPage() {
  const result = await safeLoad(async () => {
    const [jenisList, pengumpulan, penjualan] = await Promise.all([
      sheets.listJenisSampah(),
      sheets.listPengumpulan(),
      sheets.listPenjualan(),
    ]);
    const jenisMap = new Map(jenisList.map((j) => [j.id, j]));
    const stok = ringkasStokPerJenis(jenisList, pengumpulan);
    return { penjualan, jenisMap, stok };
  });

  if (!result.ok) {
    return (
      <div>
        <PageHeader title="Penjualan" />
        <ConfigNotice error={result.error} />
      </div>
    );
  }

  const { penjualan, jenisMap, stok } = result.data;

  return (
    <div>
      <PageHeader title="Penjualan" description="Penjualan stok ke pengepul, stok diambil otomatis metode FIFO." />
      <PenjualanForm stok={stok} />

      {penjualan.length === 0 ? (
        <EmptyState title="Belum ada penjualan" description="Catat penjualan pertama menggunakan form di atas." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Tanggal</Th>
              <Th>Pengepul</Th>
              <Th>Jenis</Th>
              <Th>Berat</Th>
              <Th>Modal</Th>
              <Th>Pendapatan</Th>
              <Th>Laba</Th>
            </tr>
          </thead>
          <tbody>
            {penjualan.map((p) => (
              <tr key={p.id}>
                <Td>{formatTanggal(p.tanggal)}</Td>
                <Td className="font-medium">{p.pengepul}</Td>
                <Td>{jenisMap.get(p.jenis_id)?.nama ?? "-"}</Td>
                <Td>{p.total_kg.toFixed(1)} kg</Td>
                <Td>{formatRupiah(p.total_modal)}</Td>
                <Td>{formatRupiah(p.total_pendapatan)}</Td>
                <Td className="font-medium text-primary-ink">{formatRupiah(p.laba)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
