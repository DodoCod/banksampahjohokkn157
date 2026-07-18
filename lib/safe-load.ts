export type LoadResult<T> = { ok: true; data: T } | { ok: false; error: string };

/**
 * Bungkus pemanggilan service (yang bisa gagal jika Google Sheets belum
 * dikonfigurasi) sehingga JSX tidak pernah dibangun di dalam try/catch.
 */
export async function safeLoad<T>(fn: () => Promise<T>): Promise<LoadResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Terjadi kesalahan." };
  }
}
