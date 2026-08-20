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
 * Workers mühitində bağlantı hovuzu yoxdur — binding hər izolyatda sabit qalır,
 * ona görə klient bir dəfə yaradılıb izolyat boyu təkrar istifadə olunur.
 * Binding yalnız sorğu kontekstində əlçatandır, buna görə klient ilk istifadədə
 * (lazy) qurulur; modul yüklənərkən deyil.
 */
let client: PrismaClient | undefined;

function getClient(): PrismaClient {
  if (client) return client;

  const { env } = getCloudflareContext();
  const db = (env as CloudflareEnv).DB;

  if (!db) {
    throw new Error(
      "D1 binding `DB` tapılmadı. wrangler.jsonc-də d1_databases bölməsini yoxlayın.",
    );
  }

  client = new PrismaClient({ adapter: new PrismaD1(db) });
  return client;
}

/**
 * Kod bazasının qalan hissəsi `prisma.property.findMany()` şəklində yazılıb.
 * Proxy sayəsində bu yazılış dəyişmədən qalır, klient isə ilk çağırışda qurulur.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const value = Reflect.get(getClient(), prop, receiver);
    return typeof value === "function" ? value.bind(getClient()) : value;
  },
});
