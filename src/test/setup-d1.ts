import { applyD1Migrations, env } from "cloudflare:test";

/**
 * Integration testləri üçün D1 hazırlığı (#85).
 *
 * `migrations/` qovluğu production-dakı sıra ilə tətbiq olunur. `@/lib/prisma`
 * binding-i `getCloudflareContext()`-dən oxuyur — OpenNext onu qlobal simvolda
 * saxlayır, test mühitində isə həmin simvol miniflare `env`-i ilə doldurulur.
 */
const testEnv = env as unknown as { DB: D1Database; TEST_MIGRATIONS: Parameters<typeof applyD1Migrations>[1] };

await applyD1Migrations(testEnv.DB, testEnv.TEST_MIGRATIONS);

(globalThis as Record<symbol, unknown>)[Symbol.for("__cloudflare-context__")] = {
  env: testEnv,
  cf: undefined,
  ctx: { waitUntil: () => undefined, passThroughOnException: () => undefined },
};
