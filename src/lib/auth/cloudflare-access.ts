// Alt yollardan idxal `middleware.ts`-in Edge bundle-ını kiçik saxlayır — layihədə
// mövcud `jose/jwt/verify` idxalı ilə eyni qayda.
import { createRemoteJWKSet } from "jose/jwks/remote";
import { jwtVerify } from "jose/jwt/verify";

/**
 * Cloudflare Access (Zero Trust) qapısı — panelin **ikinci** müdafiə həlqəsi.
 *
 * Access tətbiqi Cloudflare tərəfində qurulanda `/admin` və `/giris` sorğuları
 * Worker-ə çatmazdan əvvəl edge-də yoxlanılır: brute-force cəhdləri, bot skanları
 * və tətbiq zəiflikləri panelə ümumiyyətlə gəlib çatmır. Access uğurlu girişdən
 * sonra sorğuya `Cf-Access-Jwt-Assertion` başlığı əlavə edir.
 *
 * Bu modul həmin token-i **imza səviyyəsində** yoxlayır. Yalnız başlığın
 * mövcudluğunu yoxlamaq kifayət deyil: Cloudflare-dən yan keçən yol tapılsa
 * (məsələn origin ünvanı birbaşa məlum olsa) saxta başlıq göndərmək mümkün olardı.
 *
 * **Qapı defolt olaraq bağlıdır.** `ACCESS_ENFORCED` yalnız Cloudflare tərəfdə
 * Access tətbiqi qurulub yoxlanandan sonra `"true"` edilməlidir — əks halda panel
 * heç kimə açılmaz. Konfiqurasiya natamam olduqda funksiya `null` qaytarır və
 * çağıran tərəf mövcud (sessiya əsaslı) müdafiə ilə davam edir.
 */

export type AccessConfig = {
  /** `<team>.cloudflareaccess.com` — Zero Trust komanda domeni. */
  teamDomain: string;
  /** Access tətbiqinin Application Audience (AUD) tag-ı. */
  audience: string;
};

/**
 * JWKS uzaq açar dəstidir; `createRemoteJWKSet` onu öz daxilində keşləyir, ona görə
 * modul səviyyəsində bir dəfə qurulur və hər sorğuda şəbəkəyə çıxmır.
 */
const jwkSetCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function jwkSetFor(teamDomain: string) {
  const cached = jwkSetCache.get(teamDomain);
  if (cached) return cached;

  const set = createRemoteJWKSet(new URL(`https://${teamDomain}/cdn-cgi/access/certs`));
  jwkSetCache.set(teamDomain, set);
  return set;
}

/** Konfiqurasiya tam deyilsə `null` — qapı işə düşmür. */
export function accessConfig(env: Record<string, string | undefined>): AccessConfig | null {
  if (env.ACCESS_ENFORCED !== "true") return null;

  const teamDomain = env.ACCESS_TEAM_DOMAIN?.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  const audience = env.ACCESS_AUD?.trim();
  if (!teamDomain || !audience) {
    console.error("[access] ACCESS_ENFORCED açıqdır, amma ACCESS_TEAM_DOMAIN/ACCESS_AUD boşdur");
    return null;
  }

  return { teamDomain, audience };
}

/** Token etibarlıdırsa `true`. Səhv, vaxtı keçmiş və ya yad audience — `false`. */
export async function verifyAccessJwt(
  token: string | null | undefined,
  config: AccessConfig,
): Promise<boolean> {
  if (!token) return false;

  try {
    await jwtVerify(token, jwkSetFor(config.teamDomain), {
      issuer: `https://${config.teamDomain}`,
      audience: config.audience,
    });
    return true;
  } catch (error) {
    console.error("[access] token yoxlanmadı:", error);
    return false;
  }
}
