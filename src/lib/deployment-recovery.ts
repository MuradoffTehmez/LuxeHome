const RELOAD_GUARD_KEY = "luxehomeestate:deployment-recovery-at";
const RELOAD_GUARD_MS = 60_000;

/** Yeni deploy-dan sonra açıq qalan tabın köhnə asset/action identifikatorlarını tanıyır. */
export function isStaleDeploymentError(value: unknown): boolean {
  const message = value instanceof Error ? value.message : String(value ?? "");
  return /(?:Server Action .+ was not found|Failed to find Server Action .+|Loading chunk .+ failed|ChunkLoadError)/i.test(message);
}

/** Davamlı server xətasında sonsuz reload dövrəsinin qarşısını alır. */
export function canAttemptDeploymentReload(lastAttempt: string | null, now = Date.now()): boolean {
  if (!lastAttempt) return true;
  const timestamp = Number(lastAttempt);
  return !Number.isFinite(timestamp) || now - timestamp >= RELOAD_GUARD_MS;
}

/**
 * Köhnə deploy xətasında səhifəni ən çox dəqiqədə bir dəfə tam yeniləyir.
 * `false` qaytararsa çağıran normal xəta ekranını və telemetriyanı davam etdirməlidir.
 */
export function attemptDeploymentReload(value: unknown): boolean {
  if (typeof window === "undefined" || !isStaleDeploymentError(value)) return false;

  try {
    const lastAttempt = window.sessionStorage.getItem(RELOAD_GUARD_KEY);
    if (!canAttemptDeploymentReload(lastAttempt)) return false;
    window.sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
  } catch {
    // Qoruyucu marker yazılmırsa reload sonsuz dövrəyə girə bilər; normal xəta
    // ekranı daha təhlükəsizdir.
    return false;
  }

  window.location.reload();
  return true;
}
