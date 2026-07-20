import { google, sheets_v4 } from "googleapis";

/**
 * Wrapper tipis di atas Google Sheets API v4.
 *
 * Autentikasi menggunakan Service Account. Set environment variable berikut
 * (lihat README.md untuk cara membuatnya):
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   GOOGLE_PRIVATE_KEY        (ganti \n literal jika disalin dari JSON)
 *   GOOGLE_SPREADSHEET_ID
 */

let cachedSheets: sheets_v4.Sheets | null = null;

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Environment variable ${name} belum diset. Cek README.md bagian "Setup Google Sheets API".`
    );
  }
  return value;
}

export function getSpreadsheetId(): string {
  return getEnv("GOOGLE_SPREADSHEET_ID");
}

function getAuth() {
  const email = getEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  // private key sering disimpan dengan \n literal di env var, perlu di-unescape
  const key = getEnv("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n");

  return new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export function getSheetsApi(): sheets_v4.Sheets {
  if (cachedSheets) return cachedSheets;
  cachedSheets = google.sheets({ version: "v4", auth: getAuth() });
  return cachedSheets;
}

/** Nama-nama sheet yang dipakai aplikasi. Harus sama persis dengan tab di spreadsheet. */
export const SHEET_NAMES = {
  JenisSampah: "JenisSampah",
  Batch: "Batch",
  Pengumpulan: "Pengumpulan",
  Penjualan: "Penjualan",
  DetailPenjualan: "DetailPenjualan",
  Kas: "Kas",
} as const;

export type SheetName = (typeof SHEET_NAMES)[keyof typeof SHEET_NAMES];

/** Header kolom per sheet, urutan HARUS konsisten dengan urutan di PRD bagian 15. */
export const SHEET_HEADERS: Record<SheetName, string[]> = {
  JenisSampah: ["id", "nama", "harga_beli", "satuan", "aktif"],
  Batch: ["id", "tanggal", "keterangan"],
  Pengumpulan: [
    "id",
    "batch_id",
    "warga",
    "jenis_id",
    "berat",
    "tipe",
    "harga_beli",
    "modal",
    "sisa_berat",
    "created_at",
  ],
  Penjualan: [
    "id",
    "tanggal",
    "pengepul",
    "jenis_ids",
    "total_kg",
    "total_modal",
    "total_pendapatan",
    "laba",
  ],
  DetailPenjualan: ["id", "penjualan_id", "pengumpulan_id", "berat", "modal"],
  Kas: ["id", "tanggal", "penjualan_id", "pemasukan", "saldo"],
};

/** Baca semua baris data (tanpa header) sebagai array of objects. */
export async function readSheet(sheetName: SheetName): Promise<Record<string, string>[]> {
  const sheets = getSheetsApi();
  const headers = SHEET_HEADERS[sheetName];
  const lastCol = String.fromCharCode(65 + headers.length - 1); // A, B, C, ...
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${sheetName}!A2:${lastCol}`,
  });
  const rows = res.data.values ?? [];
  return rows
    .filter((row) => row.some((cell) => cell !== undefined && cell !== ""))
    .map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = row[i] ?? "";
      });
      return obj;
    });
}

/** Tambah satu baris baru di akhir sheet. */
export async function appendRow(sheetName: SheetName, values: (string | number)[]): Promise<void> {
  const sheets = getSheetsApi();
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: `${sheetName}!A:A`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [values] },
  });
}

/** Tambah banyak baris sekaligus (lebih efisien daripada appendRow berkali-kali). */
export async function appendRows(sheetName: SheetName, rows: (string | number)[][]): Promise<void> {
  if (rows.length === 0) return;
  const sheets = getSheetsApi();
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: `${sheetName}!A:A`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: rows },
  });
}

/** Cari nomor baris (1-indexed, termasuk header) berdasarkan kolom id. Return null jika tidak ada. */
async function findRowNumberById(sheetName: SheetName, id: string): Promise<number | null> {
  const sheets = getSheetsApi();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${sheetName}!A:A`,
  });
  const rows = res.data.values ?? [];
  const idx = rows.findIndex((row) => row[0] === id);
  return idx === -1 ? null : idx + 1; // 1-indexed row number di spreadsheet
}

/** Update satu baris penuh berdasarkan id (kolom pertama harus "id"). */
export async function updateRowById(
  sheetName: SheetName,
  id: string,
  values: (string | number)[]
): Promise<boolean> {
  const rowNumber = await findRowNumberById(sheetName, id);
  if (rowNumber === null) return false;
  const sheets = getSheetsApi();
  const headers = SHEET_HEADERS[sheetName];
  const lastCol = String.fromCharCode(65 + headers.length - 1);
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${sheetName}!A${rowNumber}:${lastCol}${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
  return true;
}

/** Update sebagian kolom saja pada baris tertentu (misal cuma sisa_berat). */
export async function updatePartialById(
  sheetName: SheetName,
  id: string,
  partial: Record<string, string | number>
): Promise<boolean> {
  const rowNumber = await findRowNumberById(sheetName, id);
  if (rowNumber === null) return false;
  const headers = SHEET_HEADERS[sheetName];
  const sheets = getSheetsApi();

  // ambil baris saat ini supaya kolom yang tidak diubah tetap sama
  const lastCol = String.fromCharCode(65 + headers.length - 1);
  const current = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${sheetName}!A${rowNumber}:${lastCol}${rowNumber}`,
  });
  const currentRow = current.data.values?.[0] ?? [];
  const merged = headers.map((h, i) => (h in partial ? partial[h] : currentRow[i] ?? ""));

  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${sheetName}!A${rowNumber}:${lastCol}${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [merged] },
  });
  return true;
}

/** Hapus satu baris berdasarkan id (menggunakan batchUpdate deleteDimension). */
export async function deleteRowById(sheetName: SheetName, id: string): Promise<boolean> {
  const sheets = getSheetsApi();
  const rowNumber = await findRowNumberById(sheetName, id);
  if (rowNumber === null) return false;

  const meta = await sheets.spreadsheets.get({ spreadsheetId: getSpreadsheetId() });
  const sheet = meta.data.sheets?.find((s) => s.properties?.title === sheetName);
  const sheetId = sheet?.properties?.sheetId;
  if (sheetId === undefined || sheetId === null) return false;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: getSpreadsheetId(),
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: rowNumber - 1,
              endIndex: rowNumber,
            },
          },
        },
      ],
    },
  });
  return true;
}

/**
 * Pastikan semua sheet & header sudah ada. Aman dipanggil berkali-kali (idempotent).
 * Dipanggil manual lewat halaman /setup atau route /api/setup.
 */
export async function ensureSheetsAndHeaders(): Promise<{ created: string[] }> {
  const sheets = getSheetsApi();
  const spreadsheetId = getSpreadsheetId();
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existingTitles = new Set(meta.data.sheets?.map((s) => s.properties?.title) ?? []);

  const created: string[] = [];
  const toAdd = Object.values(SHEET_NAMES).filter((name) => !existingTitles.has(name));

  if (toAdd.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: toAdd.map((title) => ({ addSheet: { properties: { title } } })),
      },
    });
    created.push(...toAdd);
  }

  // Tulis header untuk setiap sheet (menimpa baris 1, aman walau sudah ada)
  for (const name of Object.values(SHEET_NAMES)) {
    const headers = SHEET_HEADERS[name];
    const lastCol = String.fromCharCode(65 + headers.length - 1);
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${name}!A1:${lastCol}1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [headers] },
    });
  }

  return { created };
}
