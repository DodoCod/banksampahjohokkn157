import { Card } from "@/components/ui/primitives";

export function ConfigNotice({ error }: { error: string }) {
  return (
    <Card className="p-6 border-amber-600/40 bg-amber-100/40">
      <p className="font-display font-medium mb-1">Belum terhubung ke Google Spreadsheet</p>
      <p className="text-sm text-ink-soft mb-3">{error}</p>
      <p className="text-sm text-ink-soft">
        Ikuti langkah di <code className="px-1 py-0.5 rounded bg-white/70 border border-line text-xs">README.md</code>{" "}
        bagian &quot;Setup Google Sheets API&quot; untuk membuat Service Account, membagikan
        Spreadsheet, dan mengisi file <code className="px-1 py-0.5 rounded bg-white/70 border border-line text-xs">.env.local</code>.
        Setelah itu jalankan ulang aplikasi lalu buka halaman{" "}
        <a href="/setup" className="underline text-primary-ink">/setup</a> untuk membuat sheet &amp; header
        otomatis.
      </p>
    </Card>
  );
}
