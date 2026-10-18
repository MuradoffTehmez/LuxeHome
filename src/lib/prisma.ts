import { PrismaD1 } from "@prisma/adapter-d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
// Engine seçimi: `@prisma/client` paketinin `exports` xəritəsində "node" açarı
// "workerd"-dən əvvəl gəlir, esbuild isə platform=node ilə işlədiyi üçün həmişə
// Node binary engine-i seçirdi (Workers-də mövcud olmayan .so faylı).
// Wasm engine birbaşa göstərilir — D1 driver adapter yalnız bununla işləyir.
import { PrismaClient } from "@prisma/client/wasm.js";
import { registerRequestCleanup } from "@/lib/request-lifetime";

/**
 * Prisma klienti Cloudflare D1 binding (`env.DB`) üzərindən işləyir.
 *
 * **Klient sorğu başına yaradılır**, izolyat boyu paylaşılmır. Workers-də bir
 * sorğunun yaratdığı promise başqa sorğudan gözlənilə bilməz: paylaşılan
 * klientin daxili növbəsi yarımçıq kəsilmiş sorğuda (brauzer səhifəni bağlayır,
 * Next prefetch-i ləğv edir) ilişəndə sonrakı bütün sorğular onu gözləyir,
 * workerd onları «Worker's code had hung» ilə 500-ə çevirir və izolyat bir daha
 * düzəlmir. Lokal stack E2E-də (#95) 6-cı dəqiqədən sonra bütün səhifələr belə
 * düşürdü. Prisma-nın Workers nümunəsi də klienti sorğu daxilində qurur.
 *
 * Açar OpenNext-in hər sorğu üçün verdiyi `ctx` (ExecutionContext) obyektidir:
 * eyni sorğunun fon işləri (`waitUntil`, `unstable_cache` revalidasiyası) eyni
 * klienti görür, sorğu bitəndə isə `WeakMap` qeydi zibil toplayıcıya qalır.
 * Binding yalnız sorğu kontekstində əlçatandır, buna görə klient ilk istifadədə
 * (lazy) qurulur; modul yüklənərkən deyil.
 *
 * **Sorğu bitəndə klient bağlanır** (#270). Wasm query engine izolyat boyu bir
 * `WebAssembly.Instance`-dır və hər klient onun yaddaşında öz engine-ini (~1,6 MB)
 * qurur; workerd o yaddaşı `$disconnect()`-siz geri vermir. Bağlanmasa izolyat
 * yaşadıqca yaddaş böyüyür (production-da 128 MB limiti, lokalda GB-larla) və
 * yeni engine yaradıla bilmir. Sorğunun sonunu `worker.ts` müəyyən edir
 * (`trackRequestLifetime`) — klient yalnız qeydiyyatdan keçir.
 */
const requestClients = new WeakMap<object, PrismaClient>();

/** Sorğu konteksti olmayan hallar (skript, test) üçün tək klient. */
let contextlessClient: PrismaClient | undefined;

/**
 * Bu həddən uzun sorğu Workers Logs-a yazılır (#173) — hansı səhifənin hansı sorğuda
 * gözlədiyini görmək üçün. Yalnız model, əməliyyat və müddət yazılır; parametrlər
 * (şəxsi məlumat ola bilər) yazılmır.
 */
const SLOW_QUERY_MS = 200;

function createClient(db: D1Database): PrismaClient {
  const client = new PrismaClient({ adapter: new PrismaD1(db) });
  return client.$extends({
    query: {
      async $allOperations({ model, operation, args, query }) {
        const started = Date.now();
        try {
          return await query(args);
        } finally {
          const ms = Date.now() - started;
          if (ms >= SLOW_QUERY_MS) console.warn(`[db] yavaş sorğu ${model ?? "raw"}.${operation} ${ms} ms`);
        }
      },
    },
  }) as unknown as PrismaClient;
}

function getClient(): PrismaClient {
  const { env, ctx } = getCloudflareContext();
  const db = (env as CloudflareEnv).DB;

  if (!db) {
    throw new Error(
      "D1 binding `DB` tapılmadı. wrangler.jsonc-də d1_databases bölməsini yoxlayın.",
    );
  }

  if (!ctx) {
    contextlessClient ??= createClient(db);
    return contextlessClient;
  }

  let client = requestClients.get(ctx);
  if (!client) {
    const created = createClient(db);
    requestClients.set(ctx, created);
    // Engine-in wasm yaddaşı yalnız `$disconnect()` ilə azad olur (#270) — sorğu bitəndə bağlanır.
    registerRequestCleanup(ctx, () => {
      requestClients.delete(ctx);
      return created.$disconnect();
    });
    client = created;
  }
  return client;
}

/**
 * Kod bazasının qalan hissəsi `prisma.property.findMany()` şəklində yazılıb.
 * Proxy sayəsində bu yazılış dəyişmədən qalır, klient isə ilk çağırışda qurulur.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
