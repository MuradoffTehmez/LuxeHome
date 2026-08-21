import "server-only";
import { readStageCookie, verifyStageToken } from "./cookies";

/**
 * Qurulum mərhələsindəki TOTP sirrini oxuyur.
 *
 * Qəsdən server action deyil: `"use server"` faylından ixrac olunsaydı, sirri
 * qaytaran ayrıca HTTP son nöqtəsi yaranardı. Burada isə yalnız server komponenti
 * çağıra bilir.
 */
export async function readEnrollmentSecret(): Promise<{ uid: string; secret: string } | null> {
  const token = await readStageCookie();
  const claims = token ? await verifyStageToken(token) : null;
  if (!claims || claims.stage !== "enroll" || !claims.secret) return null;
  return { uid: claims.uid, secret: claims.secret };
}
