/**
 * Saxlanmış axtarış digest-ini işə salan cron worker.
 *
 * **Niyə ayrıca worker.** Əsas sayt OpenNext ilə qurulur və generasiya olunan
 * `.open-next/worker.js` yalnız `fetch` ixrac edir. Cloudflare cron trigger-i isə
 * `scheduled()` handler çağırır — onu əsas worker-ə əlavə etmək generasiya olunan
 * giriş nöqtəsini əl ilə sarımaq deməkdir və hər OpenNext yeniləməsində sınma
 * riski yaradır. Bu kiçik worker həmin riski sıfıra endirir: sayt öz axınında
 * qalır, cron isə ayrıca yayımlanır.
 *
 * İş bölgüsü qəsdən belədir — bu worker **heç bir biznes məntiqi daşımır**,
 * yalnız qorunan marşrutu çağırır. Digest məntiqi
 * `src/lib/saved-search-digest.ts`-də qalır və orada test olunur.
 */

type CronEnv = {
  /** Çağırılacaq marşrut — production və staging üçün fərqlidir. */
  DIGEST_URL: string;
  /** `Authorization: Bearer` başlığında gedən sirr. Mühit üzrə fərqli olmalıdır. */
  CRON_SECRET?: string;
};

/**
 * Marşrut sirri olmayan sorğuya 404 qaytarır, ona görə açar burada yoxdursa
 * ümumiyyətlə sorğu atmağın mənası yoxdur — jurnalda aydın səbəb qalsın.
 */
async function runDigest(env: CronEnv): Promise<void> {
  if (!env.CRON_SECRET) {
    console.error("[cron] CRON_SECRET təyin edilməyib — digest çağırılmadı.");
    return;
  }

  const response = await fetch(env.DIGEST_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.CRON_SECRET}`,
      // Cloudflare bot qoruması boş user-agent-li sorğunu çətinləşdirə bilir
      "User-Agent": "luxehomeestate-cron/1.0",
    },
  });

  const body = await response.text();

  if (!response.ok) {
    // 404 = sirr uyğun gəlmir və ya marşrut bağlıdır; 500 = digest özü çökdü
    console.error(`[cron] digest ${response.status} qaytardı: ${body.slice(0, 500)}`);
    return;
  }

  console.log(`[cron] digest tamamlandı: ${body.slice(0, 500)}`);
}

const worker = {
  async scheduled(_controller: ScheduledController, env: CronEnv, ctx: ExecutionContext) {
    // `waitUntil` olmadan handler qayıdan kimi işləmə dayana bilər
    ctx.waitUntil(
      runDigest(env).catch((error) => {
        console.error("[cron] digest çağırışı alınmadı:", error);
      }),
    );
  },
};

export default worker;
