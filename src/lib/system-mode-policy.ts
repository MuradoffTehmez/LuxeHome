import {
  DEFAULT_LOCALE,
  LOCALES,
  SYSTEM_MODES,
  type Locale,
  type SystemMode,
} from "@/lib/constants";

/**
 * Sistem rejiminin **saf** qərar qatı.
 *
 * Bu fayl qəsdən heç bir I/O daşımır: nə D1, nə `next/headers`, nə Prisma.
 * Səbəb `session-policy.ts` ilə eynidir — qapının davranışı baza qaldırmadan
 * test edilməlidir. Səhv qərar burada ya saytı adi istifadəçilər üçün açıq
 * qoyar, ya da super admini öz panelindən kənarda kilidləyər.
 *
 * Oxuma, keş və mühit override-ları `src/lib/system-mode.ts`-dədir.
 */

// ---------------------------------------------------------------------------
// KONFİQURASİYA MODELİ
// ---------------------------------------------------------------------------

/** Üç dilin hamısını daşıyan mətn. Boş sətir «kataloq defoltu işlət» deməkdir. */
export type LocalizedText = Record<Locale, string>;

export type SystemModeConfig = {
  mode: SystemMode;
  title: LocalizedText;
  description: LocalizedText;
  /**
   * İstifadəçiyə mətn kimi göstərilən təxmini açılış vaxtı (ISO 8601).
   * Geri sayımdan ayrıdır: bu, «təxminən saat 18:00-da qayıdırıq» bildirişidir.
   */
  expectedBackAt: string | null;
  /** Rejimin nə vaxt başladığı — yalnız informativ, qapı qərarına təsir etmir. */
  startAt: string | null;
  /**
   * Geri sayımın hədəfi (ISO 8601).
   *
   * **Vaxt bitdikdə rejim avtomatik dəyişmir.** Səhifədəki geri sayım yalnız
   * ziyarətçiyə məlumat verir; `mode` dəyərini yalnız admin paneli (və ya
   * mühit override-u) dəyişə bilər. Əks halda brauzerdəki saat sürüşməsi
   * saytı gözlənilmədən açardı.
   */
  endAt: string | null;
  /** `false` olduqda super admin də texniki xidmət səhifəsini görür. */
  superAdminBypass: boolean;
  showCountdown: boolean;
  /** Son yazılışın möhürü — panel diaqnostikası və keş izahı üçün. */
  updatedAt: string | null;
};

export const EMPTY_LOCALIZED_TEXT: LocalizedText = { az: "", en: "", ru: "" };

export const DEFAULT_SYSTEM_MODE_CONFIG: SystemModeConfig = {
  mode: SYSTEM_MODES.NORMAL,
  title: EMPTY_LOCALIZED_TEXT,
  description: EMPTY_LOCALIZED_TEXT,
  expectedBackAt: null,
  startAt: null,
  endAt: null,
  superAdminBypass: true,
  showCountdown: true,
  updatedAt: null,
};

function isSystemMode(value: unknown): value is SystemMode {
  return typeof value === "string" && value in SYSTEM_MODES;
}

/** Naməlum dəyəri dəstəklənən rejimə gətirir — tanınmayan sətir `NORMAL` sayılır. */
export function toSystemMode(value: unknown): SystemMode {
  return isSystemMode(value) ? value : SYSTEM_MODES.NORMAL;
}

function toLocalizedText(value: unknown): LocalizedText {
  const source = (value ?? {}) as Record<string, unknown>;
  const text = { ...EMPTY_LOCALIZED_TEXT };
  for (const locale of Object.values(LOCALES)) {
    const raw = source[locale];
    if (typeof raw === "string") text[locale] = raw.trim();
  }
  return text;
}

/** Yalnız oxunaqlı ISO möhürü qəbul edir; pozulmuş dəyər `null` olur. */
function toIsoOrNull(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function toBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

/**
 * `Setting` sətrindən konfiqurasiyanı çıxarır.
 *
 * Pozulmuş JSON saytı bağlamamalıdır: parse alınmasa defolt (`NORMAL`)
 * qaytarılır. Tərs qərar — «oxuya bilmədim, deməli bağlayıram» — bir
 * səhv miqrasiyada bütün saytı itirərdi.
 */
export function parseSystemModeConfig(raw: string | null | undefined): SystemModeConfig {
  if (!raw?.trim()) return DEFAULT_SYSTEM_MODE_CONFIG;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return DEFAULT_SYSTEM_MODE_CONFIG;
  }
  if (!parsed || typeof parsed !== "object") return DEFAULT_SYSTEM_MODE_CONFIG;

  const source = parsed as Record<string, unknown>;
  return {
    mode: toSystemMode(source.mode),
    title: toLocalizedText(source.title),
    description: toLocalizedText(source.description),
    expectedBackAt: toIsoOrNull(source.expectedBackAt),
    startAt: toIsoOrNull(source.startAt),
    endAt: toIsoOrNull(source.endAt),
    superAdminBypass: toBoolean(source.superAdminBypass, true),
    showCountdown: toBoolean(source.showCountdown, true),
    updatedAt: toIsoOrNull(source.updatedAt),
  };
}

export function serializeSystemModeConfig(config: SystemModeConfig): string {
  return JSON.stringify(config);
}

/** Konfiqurasiyadan istifadəçinin dilindəki mətni seçir; boşdursa `null`. */
export function localizedValue(text: LocalizedText, locale: Locale): string | null {
  return text[locale]?.trim() || text[DEFAULT_LOCALE]?.trim() || null;
}

// ---------------------------------------------------------------------------
// MARŞRUT İSTİSNALARI
// ---------------------------------------------------------------------------

/**
 * Texniki xidmət rejimində **heç bir yoxlama olmadan** açıq qalan yollar.
 *
 * Siyahı qəsdən çox qısadır. Tək səbəb var: super admin bypass ala bilməsi
 * üçün əvvəlcə giriş edə bilməlidir, giriş isə `/giris` axınındadır (parol →
 * 2FA). Bu yol bağlansaydı, sessiyası olmayan super admin saytı yenidən aça
 * bilməzdi və yeganə çıxış `FORCE_MAINTENANCE` mühit dəyərini geri götürüb
 * yenidən yayım etmək olardı.
 *
 * İctimai giriş/qeydiyyat (`/daxil-ol`, `/qeydiyyat`) **daxil deyil** — adi
 * istifadəçinin texniki xidmət vaxtı hesab yaratmasına ehtiyac yoxdur.
 *
 * `/api/*`, `/_next/*` və `/media/*` burada sadalanmır, çünki onlar
 * middleware matcher-ından onsuz da kənardadır; API qatındakı qoruma
 * `src/lib/system-mode.ts`-dəki `assertSystemWritable()` ilə verilir.
 */
const MAINTENANCE_EXEMPT_PREFIXES = ["/giris"] as const;

export function isMaintenanceExemptPath(routePath: string): boolean {
  return MAINTENANCE_EXEMPT_PREFIXES.some(
    (prefix) => routePath === prefix || routePath.startsWith(`${prefix}/`),
  );
}

/** Panelin özü — bypass alan super admin buraya düşür. */
export function isAdminRoutePath(routePath: string): boolean {
  return routePath === "/admin" || routePath.startsWith("/admin/");
}

// ---------------------------------------------------------------------------
// QAPI QƏRARI
// ---------------------------------------------------------------------------

/** Middleware-in imzalı cookie-dən oxuya bildiyi minimum sessiya proyeksiyası. */
export type BypassClaims = {
  accountType: string;
  authKind: string;
  role: string;
};

export type MaintenanceGateInput = {
  mode: SystemMode;
  /** Locale prefiksi çıxarılmış yol (`/az/emlaklar` → `/emlaklar`). */
  routePath: string;
  superAdminBypass: boolean;
  /** İmzalı sessiya cookie-sindən oxunan iddia; cookie yoxdursa `null`. */
  claims: BypassClaims | null;
};

export type MaintenanceGateDecision =
  /** Sorğu normal axına buraxılır. */
  | { action: "allow" }
  /** 503 texniki xidmət cavabı qaytarılır. */
  | { action: "block" }
  /**
   * Cookie super admin iddiası daşıyır, amma iddia imzalıdır — **təzə deyil**.
   * Çağıran tərəf sessiyanı D1-dən təsdiqləməli, yalnız sonra buraxmalıdır.
   */
  | { action: "verify-bypass" };

/**
 * Texniki xidmət qapısının qərarı.
 *
 * Rol yoxlaması qəsdən iki addımlıdır. Middleware D1-ə çıxmadan yalnız cookie
 * imzasını yoxlaya bilir; imza saxtalaşdırıla bilməz (`AUTH_SECRET` ilə
 * `jose`), ona görə «SUPER_ADMIN iddiası» özü etibarlıdır — amma **köhnəlmiş**
 * ola bilər: sessiya ləğv edilib, istifadəçi deaktiv edilib və ya rolu
 * aşağı salınıb. Bu üç halda cookie hələ də köhnə rolu daşıyır.
 *
 * Buna görə qərar `verify-bypass`-dir: D1 yoxlaması **yalnız** super admin
 * iddiası olan sorğularda aparılır. Adi ziyarətçi üçün əlavə sorğu yoxdur,
 * yəni performans hədəfi (`hər request üçün lazımsız D1 query yaratma`)
 * pozulmur; təhlükəsizlik isə tam server tərəfdə qalır.
 *
 * URL parametri ilə (`?admin=true`) bypass **yoxdur və olmamalıdır**:
 * belə parametr linkdə, Referer başlığında və server loglarında yayılır.
 */
export function decideMaintenanceGate(input: MaintenanceGateInput): MaintenanceGateDecision {
  if (input.mode !== SYSTEM_MODES.MAINTENANCE) return { action: "allow" };

  // Əməkdaş girişi həmişə açıqdır — bypass üçün yeganə giriş nöqtəsidir.
  if (isMaintenanceExemptPath(input.routePath)) return { action: "allow" };

  if (!input.superAdminBypass) return { action: "block" };
  if (!isSuperAdminClaim(input.claims)) return { action: "block" };

  return { action: "verify-bypass" };
}

/**
 * Cookie iddiasının super admin olub-olmadığı.
 *
 * Üç şərtin hamısı tələb olunur: hesab şirkət əməkdaşıdır, sessiya iki
 * mərhələli giriş axınından gəlib (ictimai giriş ekranı ilə açılmış əməkdaş
 * sessiyası 2FA-nı yan keçərdi) və rol məhz `SUPER_ADMIN`-dir.
 * `ADMIN` və `EDITOR` avtomatik bypass almır — bu qəsdəndir.
 */
export function isSuperAdminClaim(claims: BypassClaims | null): boolean {
  if (!claims) return false;
  return (
    claims.accountType === "STAFF" &&
    claims.authKind === "STAFF_2FA" &&
    claims.role === "SUPER_ADMIN"
  );
}

// ---------------------------------------------------------------------------
// YAZMA QAPISI (READ_ONLY)
// ---------------------------------------------------------------------------

/** Məlumat dəyişdirən HTTP metodları. */
const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function isWriteMethod(method: string): boolean {
  return WRITE_METHODS.has(method.toUpperCase());
}

/**
 * Yazma əməliyyatının bloklanıb-bloklanmadığı.
 *
 * `READ_ONLY` hər yazmanı bağlayır. `MAINTENANCE`-də yazma yalnız super admin
 * üçün açıqdır: rejim aktiv olanda panel işləməyə davam etməlidir, yoxsa
 * rejimi söndürən action-ın özü də bloklanardı.
 */
export function isWriteBlocked(mode: SystemMode, isSuperAdmin: boolean): boolean {
  if (mode === SYSTEM_MODES.READ_ONLY) return true;
  if (mode === SYSTEM_MODES.MAINTENANCE) return !isSuperAdmin;
  return false;
}

// ---------------------------------------------------------------------------
// GERİ SAYIM
// ---------------------------------------------------------------------------

/**
 * Geri sayım göstərilməlidirmi.
 *
 * Hədəf keçmişdə qalıbsa göstərilmir: «-00:03:12» ziyarətçiyə heç nə demir və
 * rejimin dayandığı təəssüratı yaradır. Rejim isə yerində qalır — vaxtın
 * bitməsi onu söndürmür.
 */
export function countdownTargetMs(config: SystemModeConfig, now: Date): number | null {
  if (!config.showCountdown || !config.endAt) return null;
  const target = new Date(config.endAt).getTime();
  return target > now.getTime() ? target : null;
}
