/**
 * Daxili cron çağırışının açarı (#161).
 *
 * `worker.ts`-in `scheduled()` handler-i işi adi marşrut kimi (`/api/cron/leads`) özü çağırır.
 * Kənar `CRON_SECRET` secret-i qurulmayıbsa da işləsin deyə açar `AUTH_SECRET`-dən törədilir:
 * onu bilməyən onu hesablaya bilmir, ayrıca secret saxlamaq lazım gəlmir. Bu modul Prisma
 * və Next idxal etmir — worker sarğısı da onu işlədir.
 */
export async function internalCronToken(authSecret: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${authSecret}:internal-cron:v1`));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Cron ifadəsindən iş adı — `wrangler.jsonc` → `triggers.crons` ilə sinxron saxlanmalıdır. */
export const CRON_JOBS = {
  "*/10 * * * *": "escalate",
  "20 0 * * *": "response-stats",
} as const satisfies Record<string, string>;

export type CronJob = (typeof CRON_JOBS)[keyof typeof CRON_JOBS];

export function cronJobFor(expression: string): CronJob | null {
  return (CRON_JOBS as Record<string, CronJob>)[expression] ?? null;
}
