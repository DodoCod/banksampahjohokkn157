export const SESSION_COOKIE = "bs_session";

const encoder = new TextEncoder();

async function sha256Hex(input: string): Promise<string> {
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Nilai cookie sesi yang valid = hash dari (password admin + secret).
 * Dihitung ulang di setiap request oleh middleware, jadi tidak perlu
 * penyimpanan sesi terpisah (cocok untuk 1 admin, tanpa database sesi).
 */
export async function getExpectedSessionValue(): Promise<string> {
  const secret = process.env.SESSION_SECRET || "banksampah-default-secret-ganti-ini";
  const password = process.env.ADMIN_PASSWORD || "";
  return sha256Hex(`${password}:${secret}`);
}

export async function verifyPassword(input: string): Promise<boolean> {
  const password = process.env.ADMIN_PASSWORD || "";
  if (!password) return false;
  return input === password;
}
