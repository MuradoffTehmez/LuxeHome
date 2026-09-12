"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { LOCALES, PERMISSIONS, ROLES, SYSTEM_MODES } from "@/lib/constants";
import { SETTING_KEYS, setSettings } from "@/lib/settings";
import {
  bustSystemModeCache,
  getSystemModeConfig,
} from "@/lib/system-mode";
import {
  serializeSystemModeConfig,
  type LocalizedText,
  type SystemModeConfig,
} from "@/lib/system-mode-policy";
import { type ActionState, failure, invalid, success, unexpected } from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import * as form from "@/lib/admin/form";

/**
 * Sistem rejiminin yazılması.
 *
 * Rejim bütün platformaya təsir etdiyi üçün qapı adi `settings:manage`
 * icazəsindən sərtdir: yalnız `SUPER_ADMIN`. `ADMIN` rolu `SETTINGS_MANAGE`
 * icazəsini daşımır, amma yoxlama yenə də açıq şəkildə roldan gedir — icazə
 * matrisi gələcəkdə dəyişsə belə bu action yerində qalsın.
 */

const MODE_VALUES = Object.values(SYSTEM_MODES) as [string, ...string[]];

const systemModeSchema = z.object({
  mode: z.enum(MODE_VALUES),
  titleAz: z.string().trim().max(160),
  titleEn: z.string().trim().max(160),
  titleRu: z.string().trim().max(160),
  descriptionAz: z.string().trim().max(600),
  descriptionEn: z.string().trim().max(600),
  descriptionRu: z.string().trim().max(600),
  expectedBackAt: z.string().trim().max(40).nullable(),
  startAt: z.string().trim().max(40).nullable(),
  endAt: z.string().trim().max(40).nullable(),
  superAdminBypass: z.boolean(),
  showCountdown: z.boolean(),
});

/**
 * `datetime-local` dəyəri (`2026-09-12T18:00`) → ISO möhürü.
 *
 * Brauzer yerli vaxt göndərir, `new Date()` isə onu server saat qurşağında
 * oxuyur. Worker UTC-də işlədiyi üçün nəticə düzgün olmazdı, ona görə dəyər
 * Bakı vaxtı kimi şərh olunur: panel istifadəçisi məhz bu qurşaqdadır və
 * texniki xidmət vaxtını ona görə planlaşdırır.
 */
function toIso(value: string | null): string | null {
  if (!value) return null;
  // `+04:00` — Azərbaycan yay vaxtı keçidi tətbiq etmir, sabit offsetdir.
  const parsed = new Date(`${value.length === 16 ? `${value}:00` : value}+04:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function localized(az: string, en: string, ru: string): LocalizedText {
  return { az, en, ru };
}

export async function saveSystemMode(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let user;
  try {
    // `requireAdminAction()` mənbəni (CSRF), sessiyanı D1-dən, icazəni və
    // sürət limitini yoxlayır.
    //
    // `skipSystemModeGate` bu action üçün **mütləqdir**: generic qapı
    // `READ_ONLY`-də hər yazmanı bağlayır, bu action isə məhz rejimi
    // dəyişən action-dır. Qapı tətbiq olunsaydı, `READ_ONLY`-dən `NORMAL`-a
    // qayıtmaq mümkün olmazdı. Aşağıdakı `SUPER_ADMIN` yoxlaması yerindədir.
    user = await requireAdminAction(PERMISSIONS.SETTINGS_MANAGE, { skipSystemModeGate: true });
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  // İcazə matrisindən **əlavə** rol yoxlaması. `SETTINGS_MANAGE` bu gün yalnız
  // `SUPER_ADMIN`-dədir, amma matris gələcəkdə genişlənə bilər; rejim isə bütün
  // platformanı bağlayan əməliyyatdır və şərti burada açıq saxlamaq lazımdır.
  if (user.role !== ROLES.SUPER_ADMIN) {
    return failure("Bu əməliyyat yalnız Super Admin üçündür.");
  }

  const parsed = systemModeSchema.safeParse({
    mode: form.text(formData, "mode"),
    titleAz: form.text(formData, "titleAz"),
    titleEn: form.text(formData, "titleEn"),
    titleRu: form.text(formData, "titleRu"),
    descriptionAz: form.text(formData, "descriptionAz"),
    descriptionEn: form.text(formData, "descriptionEn"),
    descriptionRu: form.text(formData, "descriptionRu"),
    expectedBackAt: form.optionalText(formData, "expectedBackAt"),
    startAt: form.optionalText(formData, "startAt"),
    endAt: form.optionalText(formData, "endAt"),
    superAdminBypass: form.boolean(formData, "superAdminBypass"),
    showCountdown: form.boolean(formData, "showCountdown"),
  });
  if (!parsed.success) return invalid(parsed.error);

  const previous = await getSystemModeConfig();

  // Obyektin qurulması saf çevirmədir — `toIso()` pozulmuş dəyəri `null` edir,
  // istisna atmır. Ona görə `try` yalnız bazaya yazılışı əhatə edir.
  const next: SystemModeConfig = {
    mode: parsed.data.mode as SystemModeConfig["mode"],
    title: localized(parsed.data.titleAz, parsed.data.titleEn, parsed.data.titleRu),
    description: localized(
      parsed.data.descriptionAz,
      parsed.data.descriptionEn,
      parsed.data.descriptionRu,
    ),
    expectedBackAt: toIso(parsed.data.expectedBackAt),
    startAt: toIso(parsed.data.startAt),
    endAt: toIso(parsed.data.endAt),
    superAdminBypass: parsed.data.superAdminBypass,
    showCountdown: parsed.data.showCountdown,
    updatedAt: new Date().toISOString(),
  };

  try {
    // Tək JSON açarı — D1-də tranzaksiya yoxdur, bölünmüş açarlar yarımçıq
    // qalanda rejimi mətndən ayıra bilərdi.
    await setSettings({ [SETTING_KEYS.SYSTEM_MODE_CONFIG]: serializeSystemModeConfig(next) });
  } catch (error) {
    // Yazılış özü alınmadı — rejim dəyişmədi, nəticə xətadır.
    return unexpected("sistem rejimi yazılmadı", error);
  }

  // ---------------------------------------------------------------------
  // Buradan aşağısı **uğuru poza bilməz.**
  //
  // Parametr artıq yazılıb, yəni rejim qüvvədədir. Sonrakı addımın xətası
  // istifadəçiyə «saxlanılmadı» kimi qaytarılsaydı, super admin texniki
  // xidməti aktivləşdirib bunu bilməyə bilərdi — bypass söndürülü olsaydı
  // bu, öz-özünü kənarda qoymaq demək idi. D1 tranzaksiya dəstəkləmədiyinə
  // görə addımları geri qaytarmaq da mümkün deyil, ona görə hər biri ayrıca
  // udulur və yalnız log-a düşür.
  // ---------------------------------------------------------------------

  bustSystemModeCache();

  // Audit jurnalı mövcud infrastrukturu işlədir — paralel sistem qurulmur.
  // `recordAudit()` özü uğursuzluğu udur, burada isə əlavə qat kimi qalır.
  if (previous.mode !== next.mode) {
    await recordAudit(
      user,
      "SYSTEM_MODE_CHANGE",
      "SystemMode",
      SETTING_KEYS.SYSTEM_MODE_CONFIG,
      `Sistem rejimi: ${previous.mode} → ${next.mode}`,
      { oldValue: { mode: previous.mode }, newValue: { mode: next.mode } },
    );
  } else {
    await recordAudit(
      user,
      "UPDATE",
      "SystemMode",
      SETTING_KEYS.SYSTEM_MODE_CONFIG,
      "Texniki xidmət səhifəsinin parametrləri yeniləndi",
    );
  }

  try {
    revalidatePath("/admin/sistem");
    // Rejim ictimai səthin hamısına təsir edir.
    revalidatePath("/", "layout");
    for (const locale of Object.values(LOCALES)) {
      revalidatePath(`/${locale}`, "layout");
    }
  } catch (error) {
    // Keş invalidasiyası alınmasa rejim yenə qüvvədədir: qapı hər sorğuda
    // parametri oxuyur, ISR keşi isə ən geci 15 saniyəyə özü yenilənir.
    console.error("[admin] sistem rejimi keşi invalidasiya edilmədi:", error);
  }

  return success(
    previous.mode === next.mode
      ? "Texniki xidmət parametrləri yadda saxlanıldı."
      : `Sistem rejimi dəyişdirildi: ${next.mode}.`,
  );
}
