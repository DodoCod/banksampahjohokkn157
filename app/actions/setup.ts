"use server";

import { ensureSheetsAndHeaders } from "@/lib/sheets-client";

export async function setupSpreadsheetAction() {
  const result = await ensureSheetsAndHeaders();
  return result;
}
