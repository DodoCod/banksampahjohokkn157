import { CardStat, EmptyState, PageHeader, Table, Th, Td, Badge } from "@/components/ui/primitives";
import { ConfigNotice } from "@/components/config-notice";
import * as sheets from "@/services/sheets";
import { getStokTersedia, ringkasStokPerJenis } from "@/services/stock";
import { formatKg, formatRupiah, formatTanggal } from "@/lib/utils";
import { safeLoad } from "@/lib/safe-load";

export const dynamic = "force-dynamic";

export default async function StokPage({
  searchParams,
}: {
  searchParams: Promise<{ jenis?: string }>;
}) {
  const { jenis: jenisFilter } = await searchParams;

  const result = await safeLoad(async () => {
    const [jenisList, pengumpulan, batches] = await Promise.all([
      sheets.listJenisSampah(),
      sheets.listPengumpulan(),
      sheets.listBatch(),
    ]);

    const batchMap = new Map(batches.map((b) => [b.id, b]));
    const jenisMap = new Map(jenisList.map((j) => [j.id, j]));
    const ringkasan = ringkasStokPerJenis(jenisList, pengumpulan);

    const jenisIds = jenisFilter ? [jenisFilter] : jenisList.map((j) => j.id);
    const detailRows = jenisIds
      .flatMap((jid) => getStokTersedia(jid, pengumpulan))
      .sort((a, b) => (a.created_at < b.created_at ? -1 : 1));

    return { jenisList, ringkasan, detailRows, batchMap, jenisMap };
  });

  if (!result.ok) {
    return (
      <div>
        <PageHeader title="Stok" />
        <ConfigNotice error={result.error} />
      </div>
    );
  }

  const { jenisList, ringkasan, detailRows, batchMap, jenisMap } = result.data;

  return (
    <div>
      <PageHeader title="Stok" description="Sisa stok per jenis sampah, diurutkan FIFO (masuk duluan, keluar duluan)." />

      {ringkasan.length === 0 ? (
        <EmptyState title="Belum ada stok" description="Stok akan muncul setelah ada pengumpulan sampah." />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {ringkasan.map((r) => (
            <CardStat key={r.jenis_id} label={r.jenis_nama} value={formatKg(r.total_sisa_kg)} accent="primary" />
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        <p className="text-sm font-medium">Detail batch stok</p>
        <div className="flex gap-1.5 flex-wrap">
          <a
            href="/stok"
            className={`text-xs px-2.5 py-1 rounded-full border ${
              !jenisFilter ? "bg-primary text-white border-primary" : "border-line text-ink-soft"
            }`}
          >
            Semua
          </a>
          {jenisList.map((j) => (
            <a
              key={j.id}
              href={`/stok?jenis=${j.id}`}
              className={`text-xs px-2.5 py-1 rounded-full border ${
                jenisFilter === j.id ? "bg-primary text-white border-primary" : "border-line text-ink-soft"
              }`}
            >
              {j.nama}
            </a>
          ))}
        </div>
      </div>

      {detailRows.length === 0 ? (
        <EmptyState title="Tidak ada stok untuk filter ini" />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Batch</Th>
              <Th>Jenis</Th>
              <Th>Berat awal</Th>
              <Th>Sisa</Th>
              <Th>Modal / kg</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {detailRows.map((p) => {
              const batch = batchMap.get(p.batch_id);
              const modalPerKg = p.berat > 0 ? p.modal / p.berat : 0;
              return (
                <tr key={p.id}>
                  <Td>{batch ? formatTanggal(batch.tanggal) : "-"}</Td>
                  <Td className="font-medium">{jenisMap.get(p.jenis_id)?.nama ?? "-"}</Td>
                  <Td>{p.berat.toFixed(1)} kg</Td>
                  <Td>{p.sisa_berat.toFixed(1)} kg</Td>
                  <Td>{formatRupiah(modalPerKg)}</Td>
                  <Td>
                    <Badge tone={p.tipe === "HIBAH" ? "primary" : "amber"}>
                      {p.tipe === "HIBAH" ? "Hibah" : "Dibeli"}
                    </Badge>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}
