import { getCloudflareContext } from "@opennextjs/cloudflare";
import { SYSTEM_MODES, type SystemMode } from "@/lib/constants";
import { isSessionUsable } from "@/lib/auth/session-policy";
import {
  DEFAULT_SYSTEM_MODE_CONFIG,
  isWriteBlocked,
  parseSystemModeConfig,
  toSystemMode,
  type SystemModeConfig,
} from "@/lib/system-mode-policy";

/**
 * Sistem rejiminin oxunması, keşlənməsi və yazma qapısı.
 *
 * **Niyə Prisma yox, xam D1.** Bu modul `src/middleware.ts` tərəfindən də
 * idxal olunur; middleware hər sorğuda işləyir və OpenNext onu ayrıca bundle
 * kimi yığır. Prisma klientini (və `@prisma/client/wasm.js`-i) ora çəkmək
 * middleware-i ağırlaşdırardı. Tək sətirlik `Setting` oxuması üçün
 * `env.DB.prepare()` kifayətdir.
 *
 * **Niyə D1, KV deyil.** Layihədə KV binding-i yoxdur və onu əlavə etmək hər
 * iki mühitə yeni resurs deməkdir. Daha vacibi: KV eventual consistent-dir —
 * «saytı bağladım» əmri bəzi bölgələrdə onlarla saniyə gec çatır və super
 * admin özü də hansı vəziyyəti gördüyünü bilmir. Rejim isə artıq `Setting`
 * cədvəlində saxlanan digər paneldən idarə olunan açarlarla eyni ailədəndir
 * (`demo.content_enabled`). Oxu qiyməti izolyat səviyyəli keşlə həll olunur:
 * aşağıdakı `snapshot` bir Worker izolyatının bütün sorğularını örtür, yəni
 * normal trafikdə sorğu başına D1 oxuması **yoxdur**.
 */

/** `Setting` cədvəlindəki açar. Dəyər — `SystemModeConfig` JSON-u. */
export const SYSTEM_MODE_SETTING_KEY = "system.mode_config";

/**
 * İzolyat keşinin ömrü.
 *
 * 15 saniyə iki tələb arasındakı kompromisdir: rejim dəyişikliyi bütün
 * izolyatlara görünən qədər tez yayılmalı, amma oxu D1-ə hər sorğuda
 * düşməməlidir. Dəyişikliyi edən izolyat `bustSystemModeCache()` ilə dərhal
 * yenilənir, digərləri bu müddət ərzində.
 */
const CACHE_TTL_MS = 15_000;

type Snapshot = { config: SystemModeConfig; expiresAt: number };

let snapshot: Snapshot | null = null;

/** Panel rejimi dəyişdirəndən sonra çağırılır — həmin izolyat dərhal yenilənir. */
export function bustSystemModeCache(): void {
  snapshot = null;
}

function cloudflareEnv(): Record<string, unknown> | null {
  try {
    return getCloudflareContext().env as unknown as Record<string, unknown>;
  } catch {
    // `next dev` middleware-i edge runtime-ındadır və binding görmür; server
    // tərəfdə isə `initOpenNextCloudflareForDev` kontekst qurur. Hər iki halda
    // uğursuzluq ölümcül deyil — mühit dəyərlərinə düşülür.
    return null;
  }
}

/** Həm `process.env`, həm Cloudflare binding-indən oxuyur (`runtime-env.ts` ilə eyni məntiq). */
function env(name: string): string | undefined {
  const fromProcess = process.env[name]?.trim();
  if (fromProcess) return fromProcess;
  const value = cloudflareEnv()?.[name];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

/**
 * Fövqəladə mühit override-u.
 *
 * `FORCE_MAINTENANCE="true"` bazadakı parametri **yan keçir**. Bu, D1-in özü
 * əlçatmaz olduqda və ya panelə giriş mümkün olmadıqda saytı bağlamağın
 * yeganə yoludur: `npx wrangler secret put FORCE_MAINTENANCE` (və ya
 * dashboard-dan var) → dərhal qüvvəyə minir, yayım tələb etmir.
 *
 * `SYSTEM_MODE` isə yalnız **fallback**-dir: bazadan heç nə oxunmadıqda
 * işləyir, baza cavab verəndə paneldəki dəyər üstündür.
 */
function forcedMode(): SystemMode | null {
  if (env("FORCE_MAINTENANCE") === "true") return SYSTEM_MODES.MAINTENANCE;
  return null;
}

function fallbackMode(): SystemMode {
  return toSystemMode(env("SYSTEM_MODE"));
}

async function readConfigFromD1(): Promise<SystemModeConfig | null> {
  const db = cloudflareEnv()?.DB as D1Database | undefined;
  if (!db) return null;

  try {
    const row = await db
      .prepare('SELECT "value" FROM "Setting" WHERE "key" = ?1')
      .bind(SYSTEM_MODE_SETTING_KEY)
      .first<{ value: string }>();
    return parseSystemModeConfig(row?.value ?? null);
  } catch (error) {
    // Rejim oxunmaması saytı dayandırmamalıdır — `getSetting()` ilə eyni qərar.
    console.error("[system-mode] rejim oxunmadı:", error);
    return null;
  }
}

/**
 * Cari konfiqurasiya.
 *
 * Ardıcıllıq: fövqəladə override → izolyat keşi → D1 → mühit fallback-i.
 * Uğursuz oxu da keşlənir (mənfi keşləmə): D1 nasazlığında hər sorğunun
 * uğursuz sorğu atması yalnız gecikməni artırardı.
 */
export async function getSystemModeConfig(): Promise<SystemModeConfig> {
  const forced = forcedMode();

  const now = Date.now();
  if (!snapshot || snapshot.expiresAt <= now) {
    const config = await readConfigFromD1();
    snapshot = {
      config: config ?? { ...DEFAULT_SYSTEM_MODE_CONFIG, mode: fallbackMode() },
      expiresAt: now + CACHE_TTL_MS,
    };
  }

  // Override yalnız rejimi əvəzləyir: başlıq, açıqlama və geri sayım paneldə
  // yazılmış dəyərlərdən gəlməyə davam edir.
  return forced ? { ...snapshot.config, mode: forced } : snapshot.config;
}

export async function getSystemMode(): Promise<SystemMode> {
  return (await getSystemModeConfig()).mode;
}

// ---------------------------------------------------------------------------
// SUPER ADMIN SESSİYASININ TƏSDİQİ
// ---------------------------------------------------------------------------

/**
 * SQLite `DATETIME` sütununu `Date`-ə çevirir.
 *
 * Prisma sətirləri epoch millisaniyə kimi yazır, `DEFAULT CURRENT_TIMESTAMP`
 * ilə yaranan köhnə sətirlər isə `"YYYY-MM-DD HH:MM:SS"` mətnidir (UTC).
 * Xam SQL hər iki formanı görə bilər, ona görə çevirmə burada aparılır —
 * müqayisəni SQL-ə buraxmaq iki formatı səssizcə səhv tutuşdurardı.
 */
function toDate(value: unknown): Date | null {
  if (typeof value === "number") return new Date(value);
  if (typeof value === "string") {
    const normalized = /^\d{4}-\d{2}-\d{2} /.test(value) ? `${value.replace(" ", "T")}Z` : value;
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

export type BypassVerification = {
  ok: boolean;
  /** Təsdiqlənmiş istifadəçinin ID-si — audit və diaqnostika üçün. */
  userId?: string;
};

/**
 * Texniki xidmət bypass-ının **həqiqi** yoxlaması.
 *
 * Middleware cookie imzasından super admin iddiası görəndə çağırılır. İmza
 * saxtalaşdırıla bilməz, amma köhnə ola bilər: sessiya ləğv edilib,
 * istifadəçi deaktiv edilib və ya rolu aşağı salınıb. Bunların heç biri
 * cookie-yə əks olunmur, ona görə qərar bazadan təsdiqlənir.
 *
 * Sorğu yalnız super admin iddiası olan trafikdə gedir — adi ziyarətçi bu
 * yola düşmür.
 */
export async function verifySuperAdminBypass(
  sid: string,
  claims: { uid: string; role: string; accountType: string; authKind: string },
): Promise<BypassVerification> {
  const db = cloudflareEnv()?.DB as D1Database | undefined;
  if (!db) return { ok: false };

  try {
    const row = await db
      .prepare(
        `SELECT s."userId"      AS "userId",
                s."createdAt"   AS "createdAt",
                s."expiresAt"   AS "expiresAt",
                s."revokedAt"   AS "revokedAt",
                s."authKind"    AS "authKind",
                u."role"        AS "role",
                u."accountType" AS "accountType",
                u."isActive"    AS "isActive"
           FROM "Session" s
           JOIN "User" u ON u."id" = s."userId"
          WHERE s."id" = ?1`,
      )
      .bind(sid)
      .first<Record<string, unknown>>();

    if (!row) return { ok: false };

    const createdAt = toDate(row.createdAt);
    const expiresAt = toDate(row.expiresAt);
    if (!createdAt || !expiresAt) return { ok: false };

    // Müddət siyasəti bir yerdədir — `session-policy.ts` həm bu yolu, həm də
    // `resolveSession()`-u idarə edir, ona görə iki yerdə fərqli qərar çıxa bilmir.
    if (!isSessionUsable({ createdAt, expiresAt, revokedAt: toDate(row.revokedAt) }, new Date())) {
      return { ok: false };
    }

    // İstifadəçi hesabı bağlanıbsa cookie hələ etibarlı görünür — burada tutulur.
    if (row.isActive !== 1 && row.isActive !== true) return { ok: false };

    // Cookie iddiası ilə bazanın vəziyyəti üst-üstə düşməlidir: rol aşağı
    // salınıbsa köhnə cookie artıq bypass vermir.
    if (
      row.userId !== claims.uid ||
      row.role !== claims.role ||
      row.accountType !== claims.accountType ||
      row.authKind !== claims.authKind
    ) {
      return { ok: false };
    }

    if (row.role !== "SUPER_ADMIN" || row.accountType !== "STAFF" || row.authKind !== "STAFF_2FA") {
      return { ok: false };
    }

    return { ok: true, userId: String(row.userId) };
  } catch (error) {
    // Baza cavab vermirsə bypass **verilmir** — qapı bağlı qalır.
    console.error("[system-mode] bypass sessiyası təsdiqlənmədi:", error);
    return { ok: false };
  }
}

// ---------------------------------------------------------------------------
// YAZMA QAPISI
// ---------------------------------------------------------------------------

/** Bloklanmış yazma əməliyyatının xətası. */
export class SystemWriteBlockedError extends Error {
  constructor(
    readonly mode: SystemMode,
    message: string,
  ) {
    super(message);
  }
}

export const SYSTEM_READ_ONLY_MESSAGE = "Platforma hazırda yalnız baxış rejimindədir.";
export const SYSTEM_MAINTENANCE_MESSAGE =
  "Platformada texniki xidmət aparılır. Dəyişiklik etmək mümkün deyil.";

/**
 * Məlumat dəyişdirən əməliyyatın qapısı.
 *
 * `READ_ONLY` və `MAINTENANCE` rejimlərində yazma rədd edilir. Super admin
 * istisnadır — əks halda rejimi söndürən action-ın özü bloklanardı.
 *
 * **UI-da gizlətmək kifayət deyil**: server action birbaşa POST ilə, API
 * route isə `fetch` ilə çağırıla bilir. Bu funksiya hər iki yolun ortaq
 * qapısıdır və mərkəzi guard-lardan (`requireAdminAction`,
 * `requirePublicAction`) avtomatik çağırılır.
 */
export async function assertSystemWritable(options?: { isSuperAdmin?: boolean }): Promise<void> {
  const mode = await getSystemMode();
  if (!isWriteBlocked(mode, options?.isSuperAdmin ?? false)) return;

  throw new SystemWriteBlockedError(
    mode,
    mode === SYSTEM_MODES.READ_ONLY ? SYSTEM_READ_ONLY_MESSAGE : SYSTEM_MAINTENANCE_MESSAGE,
  );
}

/** Yazma bloklanıbmı — istisna atmadan yoxlayır (səssiz no-op yolları üçün). */
export async function isSystemWriteBlocked(options?: {
  isSuperAdmin?: boolean;
}): Promise<boolean> {
  return isWriteBlocked(await getSystemMode(), options?.isSuperAdmin ?? false);
}

/**
 * API route-ları üçün strukturlaşdırılmış cavab.
 *
 * Kod `SYSTEM_READ_ONLY` / `SYSTEM_MAINTENANCE`-dir ki, müştəri tərəf iki halı
 * ayırd edə bilsin. Status 503 + `Retry-After` — səhifə qapısı ilə eyni
 * semantika: «xidmət müvəqqəti yoxdur», «resurs yoxdur» deyil.
 */
export function systemModeErrorResponse(error: { mode: SystemMode; message: string }): Response {
  return Response.json(
    {
      error: error.mode === SYSTEM_MODES.READ_ONLY ? "SYSTEM_READ_ONLY" : "SYSTEM_MAINTENANCE",
      message: error.message,
    },
    {
      status: 503,
      headers: {
        "Retry-After": "3600",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  );
}

/**
 * `MAINTENANCE` rejimində ictimai API-nin qapısı.
 *
 * Middleware matcher-i `/api/*` yollarını qəsdən əhatə etmir (səhifə qapısı
 * ora aid deyil), ona görə ictimai JSON endpoint-ləri öz yoxlamasını aparır.
 * Əks halda texniki xidmət zamanı sayt bağlı görünsə də `/api/hesab/...`
 * məlumat qaytarmağa davam edərdi.
 *
 * **Hər API bununla bağlanmır.** Açıq qalanlar və səbəbləri:
 *
 * - `/api/cron/*` — planlaşdırılmış sistem işi. `CRON_SECRET` ilə qorunur və
 *   texniki xidmət vaxtı da işləməlidir: dayandırılsa, hesab silinməsinin
 *   ikinci mərhələsi və digər idempotent maintenance tapşırıqları gecikər.
 * - `/api/webhooks/resend` — kənar sistemin göndərdiyi hadisə. 503 alsa
 *   e-poçt çatdırılma statusu itə bilər; imza ilə qorunur, məlumat isə
 *   yalnız `EmailActivity` metadatasıdır.
 * - `/api/security/turnstile` — giriş formasının açar konfiqurasiyası.
 *   Bağlansaydı super admin girişi də mümkün olmazdı.
 * - `/api/monitoring/*` — real istifadəçi telemetriyası. Məhz nasazlıq
 *   vaxtı ən dəyərli məlumatdır; sürət limiti onsuz da tətbiq olunur.
 */
export async function isPublicApiBlocked(): Promise<boolean> {
  return (await getSystemMode()) === SYSTEM_MODES.MAINTENANCE;
}

/** `MAINTENANCE` rejimində ictimai API üçün strukturlaşdırılmış 503 cavabı. */
export function maintenanceApiResponse(): Response {
  return systemModeErrorResponse({
    mode: SYSTEM_MODES.MAINTENANCE,
    message: SYSTEM_MAINTENANCE_MESSAGE,
  });
}
