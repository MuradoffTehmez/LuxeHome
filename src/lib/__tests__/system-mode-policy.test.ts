import { describe, expect, it } from "vitest";
import { SYSTEM_MODES, type SystemMode } from "@/lib/constants";
import {
  DEFAULT_SYSTEM_MODE_CONFIG,
  countdownTargetMs,
  decideMaintenanceGate,
  isMaintenanceExemptPath,
  isSuperAdminClaim,
  isWriteBlocked,
  isWriteMethod,
  localizedValue,
  parseSystemModeConfig,
  serializeSystemModeConfig,
  type BypassClaims,
} from "@/lib/system-mode-policy";

/**
 * Texniki xidmət qapısının davranış matrisi.
 *
 * Testlər `system-mode-policy.ts`-in saf funksiyalarını hədəf alır, canlı
 * mühiti yox. Səbəb praktikidir: Playwright dəsti (`e2e/`) canlı staging
 * worker-inə qarşı işləyir və orada rejimi `MAINTENANCE`-ə keçirmək bütün
 * digər testləri sındırardı. Qərar məntiqi isə tam buradadır — middleware
 * yalnız bu qərarı icra edir.
 */

const claims = (role: string, overrides: Partial<BypassClaims> = {}): BypassClaims => ({
  accountType: "STAFF",
  authKind: "STAFF_2FA",
  role,
  ...overrides,
});

function gate(mode: SystemMode, routePath: string, session: BypassClaims | null = null) {
  return decideMaintenanceGate({ mode, routePath, superAdminBypass: true, claims: session });
}

describe("NORMAL rejimi", () => {
  it("hər yolu buraxır", () => {
    for (const path of ["/", "/emlaklar", "/emlaklar/menzil-1", "/kabinet", "/admin"]) {
      expect(gate(SYSTEM_MODES.NORMAL, path)).toEqual({ action: "allow" });
    }
  });
});

describe("READ_ONLY rejimi", () => {
  it("səhifə qapısını bağlamır — məzmun görünən qalır", () => {
    for (const path of ["/", "/emlaklar", "/bilik-merkezi"]) {
      expect(gate(SYSTEM_MODES.READ_ONLY, path)).toEqual({ action: "allow" });
    }
  });

  it("məlumat dəyişdirən metodları bloklayır, oxumanı yox", () => {
    for (const method of ["POST", "PUT", "PATCH", "DELETE", "post", "delete"]) {
      expect(isWriteMethod(method)).toBe(true);
    }
    for (const method of ["GET", "HEAD", "OPTIONS"]) {
      expect(isWriteMethod(method)).toBe(false);
    }
  });

  it("yazmanı super admin üçün də bağlayır", () => {
    expect(isWriteBlocked(SYSTEM_MODES.READ_ONLY, false)).toBe(true);
    expect(isWriteBlocked(SYSTEM_MODES.READ_ONLY, true)).toBe(true);
  });
});

describe("MAINTENANCE rejimi", () => {
  it("sessiyası olmayan ziyarətçini hər ictimai yolda bloklayır", () => {
    for (const path of ["/", "/emlaklar", "/emlaklar/menzil-1", "/bilik-merkezi", "/elaqe"]) {
      expect(gate(SYSTEM_MODES.MAINTENANCE, path)).toEqual({ action: "block" });
    }
  });

  it("ictimai giriş və qeydiyyat yollarını da bloklayır", () => {
    expect(gate(SYSTEM_MODES.MAINTENANCE, "/daxil-ol")).toEqual({ action: "block" });
    expect(gate(SYSTEM_MODES.MAINTENANCE, "/qeydiyyat")).toEqual({ action: "block" });
    expect(gate(SYSTEM_MODES.MAINTENANCE, "/kabinet/elanlar")).toEqual({ action: "block" });
  });

  it("əməkdaş giriş axınını açıq saxlayır — bypass üçün yeganə giriş nöqtəsi", () => {
    expect(isMaintenanceExemptPath("/giris")).toBe(true);
    expect(isMaintenanceExemptPath("/giris/dogrulama")).toBe(true);
    expect(isMaintenanceExemptPath("/girisci")).toBe(false);
    expect(gate(SYSTEM_MODES.MAINTENANCE, "/giris")).toEqual({ action: "allow" });
  });

  it("SUPER_ADMIN iddiasını baza təsdiqinə göndərir", () => {
    expect(gate(SYSTEM_MODES.MAINTENANCE, "/", claims("SUPER_ADMIN"))).toEqual({
      action: "verify-bypass",
    });
    expect(gate(SYSTEM_MODES.MAINTENANCE, "/admin", claims("SUPER_ADMIN"))).toEqual({
      action: "verify-bypass",
    });
  });

  it("ADMIN, EDITOR və ictimai hesabı bloklayır", () => {
    expect(gate(SYSTEM_MODES.MAINTENANCE, "/", claims("ADMIN"))).toEqual({ action: "block" });
    expect(gate(SYSTEM_MODES.MAINTENANCE, "/", claims("EDITOR"))).toEqual({ action: "block" });
    expect(gate(SYSTEM_MODES.MAINTENANCE, "/admin", claims("ADMIN"))).toEqual({ action: "block" });
    expect(
      gate(
        SYSTEM_MODES.MAINTENANCE,
        "/",
        claims("SUPER_ADMIN", { accountType: "USER", authKind: "PUBLIC" }),
      ),
    ).toEqual({ action: "block" });
  });

  it("2FA-sız əməkdaş sessiyasına bypass vermir", () => {
    expect(isSuperAdminClaim(claims("SUPER_ADMIN", { authKind: "PUBLIC" }))).toBe(false);
    expect(isSuperAdminClaim(claims("SUPER_ADMIN", { accountType: "AGENCY" }))).toBe(false);
    expect(isSuperAdminClaim(null)).toBe(false);
    expect(isSuperAdminClaim(claims("SUPER_ADMIN"))).toBe(true);
  });

  it("bypass söndürüləndə super admini də bloklayır", () => {
    expect(
      decideMaintenanceGate({
        mode: SYSTEM_MODES.MAINTENANCE,
        routePath: "/",
        superAdminBypass: false,
        claims: claims("SUPER_ADMIN"),
      }),
    ).toEqual({ action: "block" });
  });

  it("yazmanı super admin üçün açıq saxlayır — rejimi söndürmək mümkün qalmalıdır", () => {
    expect(isWriteBlocked(SYSTEM_MODES.MAINTENANCE, false)).toBe(true);
    expect(isWriteBlocked(SYSTEM_MODES.MAINTENANCE, true)).toBe(false);
    expect(isWriteBlocked(SYSTEM_MODES.NORMAL, false)).toBe(false);
  });
});

describe("konfiqurasiyanın oxunuşu", () => {
  it("boş və pozulmuş dəyərdə saytı açıq saxlayır", () => {
    expect(parseSystemModeConfig(null)).toEqual(DEFAULT_SYSTEM_MODE_CONFIG);
    expect(parseSystemModeConfig("")).toEqual(DEFAULT_SYSTEM_MODE_CONFIG);
    expect(parseSystemModeConfig("{bozuk json")).toEqual(DEFAULT_SYSTEM_MODE_CONFIG);
    expect(parseSystemModeConfig('"sətir"')).toEqual(DEFAULT_SYSTEM_MODE_CONFIG);
    expect(parseSystemModeConfig('{"mode":"NAMƏLUM"}').mode).toBe(SYSTEM_MODES.NORMAL);
  });

  it("yazılan dəyəri eyni ilə geri oxuyur", () => {
    const config = {
      ...DEFAULT_SYSTEM_MODE_CONFIG,
      mode: SYSTEM_MODES.MAINTENANCE,
      title: { az: "Başlıq", en: "Heading", ru: "Заголовок" },
      description: { az: "Mətn", en: "Text", ru: "Текст" },
      endAt: new Date("2026-09-12T18:00:00.000Z").toISOString(),
      superAdminBypass: false,
      showCountdown: false,
      updatedAt: new Date("2026-09-12T10:00:00.000Z").toISOString(),
    };
    expect(parseSystemModeConfig(serializeSystemModeConfig(config))).toEqual(config);
  });

  it("pozulmuş tarixi `null` edir, bayraqların defoltunu saxlayır", () => {
    const parsed = parseSystemModeConfig('{"mode":"READ_ONLY","endAt":"filan","startAt":""}');
    expect(parsed.mode).toBe(SYSTEM_MODES.READ_ONLY);
    expect(parsed.endAt).toBeNull();
    expect(parsed.startAt).toBeNull();
    expect(parsed.superAdminBypass).toBe(true);
    expect(parsed.showCountdown).toBe(true);
  });

  it("dilə görə mətni seçir, boşluqda AZ-a, sonra `null`-a düşür", () => {
    expect(localizedValue({ az: "AZ", en: "EN", ru: "RU" }, "ru")).toBe("RU");
    expect(localizedValue({ az: "AZ", en: "", ru: "" }, "en")).toBe("AZ");
    expect(localizedValue({ az: "", en: "", ru: "" }, "az")).toBeNull();
  });
});

describe("geri sayım", () => {
  const now = new Date("2026-09-12T12:00:00.000Z");

  it("gələcək hədəf üçün möhür qaytarır", () => {
    const target = new Date("2026-09-12T13:30:00.000Z");
    expect(
      countdownTargetMs(
        { ...DEFAULT_SYSTEM_MODE_CONFIG, endAt: target.toISOString() },
        now,
      ),
    ).toBe(target.getTime());
  });

  it("keçmiş hədəfi və söndürülmüş seçimi göstərmir", () => {
    expect(
      countdownTargetMs(
        { ...DEFAULT_SYSTEM_MODE_CONFIG, endAt: "2026-09-12T11:00:00.000Z" },
        now,
      ),
    ).toBeNull();
    expect(
      countdownTargetMs(
        {
          ...DEFAULT_SYSTEM_MODE_CONFIG,
          endAt: "2026-09-12T13:00:00.000Z",
          showCountdown: false,
        },
        now,
      ),
    ).toBeNull();
  });

  it("vaxt bitəndə rejimi dəyişmir — geri sayım yalnız informativdir", () => {
    const expired = {
      ...DEFAULT_SYSTEM_MODE_CONFIG,
      mode: SYSTEM_MODES.MAINTENANCE,
      endAt: "2026-09-12T11:00:00.000Z",
    };
    expect(countdownTargetMs(expired, now)).toBeNull();
    expect(gate(expired.mode, "/")).toEqual({ action: "block" });
  });
});
