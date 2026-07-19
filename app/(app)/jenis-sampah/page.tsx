import { EmptyState, ListCardGrid, PageHeader, Table, Th } from "@/components/ui/primitives";
import { ConfigNotice } from "@/components/config-notice";
import { JenisSampahForm } from "@/components/jenis-sampah-form";
import { JenisSampahRow, JenisSampahCard } from "@/components/jenis-sampah-row";
import * as sheets from "@/services/sheets";
import { safeLoad } from "@/lib/safe-load";

export const dynamic = "force-dynamic";

export default async function JenisSampahPage() {
  const result = await safeLoad(() => sheets.listJenisSampah());

  if (!result.ok) {
    return (
      <div>
        <PageHeader title="Jenis Sampah" />
        <ConfigNotice error={result.error} />
      </div>
    );
  }

  const list = result.data;

  return (
    <div>
      <PageHeader
        title="Jenis Sampah"
        description="Master data kategori sampah dan harga beli standar per kg."
      />
      <JenisSampahForm />

      {list.length === 0 ? (
        <EmptyState
          title="Belum ada jenis sampah"
          description="Tambahkan jenis sampah pertama menggunakan form di atas."
        />
      ) : (
        <>
          <ListCardGrid>
            {list.map((item) => (
              <JenisSampahCard key={item.id} item={item} />
            ))}
          </ListCardGrid>

          <Table>
            <thead>
              <tr>
                <Th>Nama</Th>
                <Th>Harga beli</Th>
                <Th>Status</Th>
                <Th className="text-right">Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => (
                <JenisSampahRow key={item.id} item={item} />
              ))}
            </tbody>
          </Table>
        </>
      )}
    </div>
  );
}
