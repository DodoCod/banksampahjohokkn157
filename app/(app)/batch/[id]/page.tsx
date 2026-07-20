import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  Badge,
  EmptyState,
  ListCard,
  ListCardGrid,
  PageHeader,
  Table,
  Th,
  Td,
} from "@/components/ui/primitives";
import { ConfigNotice } from "@/components/config-notice";
import { SetoranForm } from "@/components/setoran-form";
import { DeleteBatchButton } from "@/components/delete-batch-button";
import * as sheets from "@/services/sheets";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import { safeLoad } from "@/lib/safe-load";

export const dynamic = "force-dynamic";

export default async function BatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const result = await safeLoad(async () => {
    const [batch, jenisList, pengumpulan] = await Promise.all([
      sheets.getBatch(id),
      sheets.listJenisSampah(),
      sheets.listPengumpulanByBatch(id),
    ]);
    return { batch, jenisList, pengumpulan };
  });

  if (!result.ok) {
    return (
      <div>
        <PageHeader title="Detail Batch" />
        <ConfigNotice error={result.error} />
      </div>
    );
  }

  const { batch, jenisList, pengumpulan } = result.data;
  if (!batch) notFound();

  const jenisMap = new Map(jenisList.map((j) => [j.id, j]));
  const totalKg = pengumpulan.reduce((s, p) => s + p.berat, 0);
  const totalModal = pengumpulan.reduce((s, p) => s + p.modal, 0);

  return (
    <div>
      <Link href="/batch" className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink mb-4">
        <ArrowLeft size={14} /> Kembali ke daftar batch
      </Link>

      <PageHeader
        title={formatTanggal(batch.tanggal)}
        description={batch.keterangan || "Batch pengumpulan sampah"}
        action={
          <DeleteBatchButton
            id={batch.id}
            tanggal={formatTanggal(batch.tanggal)}
            hasSetoran={pengumpulan.length > 0}
          />
        }
      />

      <div className="mb-6">
        <div className="flex gap-2 flex-wrap">
          <Badge>{totalKg.toFixed(1)} kg terkumpul</Badge>
          <Badge tone="amber">Modal {formatRupiah(totalModal)}</Badge>
        </div>
        {pengumpulan.length > 0 && (
          <p className="text-xs text-ink-soft mt-2">
            Batch tidak bisa dihapus lagi karena sudah punya setoran warga tercatat.
          </p>
        )}
      </div>

      <SetoranForm batchId={batch.id} jenisList={jenisList} />

      {pengumpulan.length === 0 ? (
        <EmptyState
          title="Belum ada setoran"
          description="Tambahkan setoran warga pertama menggunakan form di atas."
        />
      ) : (
        <>
          <ListCardGrid>
            {pengumpulan.map((p) => (
              <ListCard
                key={p.id}
                title={p.warga}
                subtitle={jenisMap.get(p.jenis_id)?.nama ?? "-"}
                right={`${p.berat.toFixed(1)} kg`}
                rightSub={`Sisa ${p.sisa_berat.toFixed(1)} kg`}
                badge={
                  <Badge tone={p.tipe === "HIBAH" ? "primary" : "amber"}>
                    {p.tipe === "HIBAH" ? "Hibah" : "Dibeli"}
                  </Badge>
                }
              />
            ))}
          </ListCardGrid>

          <Table>
            <thead>
              <tr>
                <Th>Warga</Th>
                <Th>Jenis</Th>
                <Th>Berat</Th>
                <Th>Status</Th>
                <Th>Modal</Th>
                <Th>Sisa stok</Th>
              </tr>
            </thead>
            <tbody>
              {pengumpulan.map((p) => (
                <tr key={p.id}>
                  <Td className="font-medium">{p.warga}</Td>
                  <Td>{jenisMap.get(p.jenis_id)?.nama ?? "-"}</Td>
                  <Td>{p.berat.toFixed(1)} kg</Td>
                  <Td>
                    <Badge tone={p.tipe === "HIBAH" ? "primary" : "amber"}>
                      {p.tipe === "HIBAH" ? "Hibah" : "Dibeli"}
                    </Badge>
                  </Td>
                  <Td>{formatRupiah(p.modal)}</Td>
                  <Td>{p.sisa_berat.toFixed(1)} kg</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}
    </div>
  );
}
