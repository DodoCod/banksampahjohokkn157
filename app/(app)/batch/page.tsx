import Link from "next/link";
import { EmptyState, PageHeader, Table, Th, Td, Badge } from "@/components/ui/primitives";
import { ConfigNotice } from "@/components/config-notice";
import { BatchForm } from "@/components/batch-form";
import * as sheets from "@/services/sheets";
import { formatTanggal } from "@/lib/utils";
import { safeLoad } from "@/lib/safe-load";

export const dynamic = "force-dynamic";

export default async function BatchPage() {
  const result = await safeLoad(async () => {
    const [batches, pengumpulan] = await Promise.all([
      sheets.listBatch(),
      sheets.listPengumpulan(),
    ]);

    const jumlahPerBatch = new Map<string, { warga: Set<string>; kg: number }>();
    for (const p of pengumpulan) {
      const cur = jumlahPerBatch.get(p.batch_id) ?? { warga: new Set<string>(), kg: 0 };
      cur.warga.add(p.warga);
      cur.kg += p.berat;
      jumlahPerBatch.set(p.batch_id, cur);
    }

    return { batches, jumlahPerBatch };
  });

  if (!result.ok) {
    return (
      <div>
        <PageHeader title="Pengumpulan Sampah" />
        <ConfigNotice error={result.error} />
      </div>
    );
  }

  const { batches, jumlahPerBatch } = result.data;

  return (
    <div>
      <PageHeader
        title="Pengumpulan Sampah"
        description="Setiap kunjungan pengumpulan dicatat sebagai satu batch."
      />
      <BatchForm />

      {batches.length === 0 ? (
        <EmptyState
          title="Belum ada batch pengumpulan"
          description="Buat batch pertama menggunakan form di atas."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Tanggal</Th>
              <Th>Keterangan</Th>
              <Th>Warga</Th>
              <Th>Total kg</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {batches.map((b) => {
              const agg = jumlahPerBatch.get(b.id);
              return (
                <tr key={b.id}>
                  <Td className="font-medium">{formatTanggal(b.tanggal)}</Td>
                  <Td>{b.keterangan || <span className="text-ink-soft">-</span>}</Td>
                  <Td>
                    <Badge>{agg?.warga.size ?? 0}</Badge>
                  </Td>
                  <Td>{(agg?.kg ?? 0).toFixed(1)} kg</Td>
                  <Td className="text-right">
                    <Link href={`/batch/${b.id}`} className="text-sm text-primary-ink hover:underline">
                      Detail →
                    </Link>
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
