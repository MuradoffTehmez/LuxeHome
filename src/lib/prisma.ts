import { PrismaD1 } from "@prisma/adapter-d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
// Engine seçimi: `@prisma/client` paketinin `exports` xəritəsində "node" açarı
// "workerd"-dən əvvəl gəlir, esbuild isə platform=node ilə işlədiyi üçün həmişə
// Node binary engine-i seçirdi (Workers-də mövcud olmayan .so faylı).
// Wasm engine birbaşa göstərilir — D1 driver adapter yalnız bununla işləyir.
import { PrismaClient } from "@prisma/client/wasm.js";

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
 */
const requestClients = new WeakMap<object, PrismaClient>();

/** Sorğu konteksti olmayan hallar (skript, test) üçün tək klient. */
let contextlessClient: PrismaClient | undefined;

function createClient(db: D1Database): PrismaClient {
  return new PrismaClient({ adapter: new PrismaD1(db) });
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
    client = createClient(db);
    requestClients.set(ctx, client);
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
