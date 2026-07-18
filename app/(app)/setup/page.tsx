"use client";

import { useState, useTransition } from "react";
import { Button, Card, PageHeader } from "@/components/ui/primitives";
import { setupSpreadsheetAction } from "@/app/actions/setup";

export default function SetupPage() {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <PageHeader
        title="Setup Spreadsheet"
        description="Membuat sheet dan header yang dibutuhkan aplikasi secara otomatis di Google Spreadsheet kamu."
      />
      <Card className="p-6 max-w-xl">
        <p className="text-sm text-ink-soft mb-4">
          Pastikan kamu sudah mengisi <code className="px-1 py-0.5 rounded bg-bg border border-line text-xs">.env.local</code>{" "}
          (GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SPREADSHEET_ID) dan sudah
          membagikan Spreadsheet ke email service account sebagai Editor. Lihat README.md untuk
          panduan lengkap.
        </p>
        <Button
          loading={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              setResult(null);
              try {
                const res = await setupSpreadsheetAction();
                setResult(
                  res.created.length > 0
                    ? `Sheet dibuat: ${res.created.join(", ")}. Header sudah ditulis di semua sheet.`
                    : "Semua sheet sudah ada. Header sudah diperbarui."
                );
              } catch (e) {
                setError(e instanceof Error ? e.message : "Terjadi kesalahan.");
              }
            })
          }
        >
          {pending ? "Menyiapkan..." : "Buat Sheet & Header"}
        </Button>
        {result && <p className="text-sm text-primary-ink mt-3">{result}</p>}
        {error && <p className="text-sm text-danger mt-3">{error}</p>}
      </Card>
    </div>
  );
}
