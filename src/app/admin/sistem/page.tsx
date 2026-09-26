import type { Metadata } from "next";
import { AlertTriangle, Database, Info, ShieldCheck, Timer } from "lucide-react";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import {
  LOCALE_TAGS,
  PERMISSIONS,
  SYSTEM_MODES,
  SYSTEM_MODE_TONE,
  type Locale,
} from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminI18n } from "@/lib/admin-i18n";
import { getSystemModeConfig } from "@/lib/system-mode";
import { getIntegrationHealth, type IntegrationHealthId } from "@/lib/integration-health";
import { SystemModeForm, type SystemModeFormValues } from "./system-mode-form";

const INTEGRATION_LABEL_KEYS = {
  searchConsole: "pages.systemMode.integrationSearchConsole",
  cloudflareAnalytics: "pages.systemMode.integrationCloudflareAnalytics",
  email: "pages.systemMode.integrationEmail",
  emailWebhook: "pages.systemMode.integrationEmailWebhook",
  geocoding: "pages.systemMode.integrationGeocoding",
  turnstile: "pages.systemMode.integrationTurnstile",
  savedSearchCron: "pages.systemMode.integrationSavedSearchCron",
  push: "pages.systemMode.integrationPush",
} as const satisfies Record<IntegrationHealthId, string>;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminI18n();
  return { title: t("pages.systemMode.title") };
}

export const dynamic = "force-dynamic";

/**
 * ISO möhürünü `datetime-local` input-unun gözlədiyi `YYYY-MM-DDTHH:mm`
 * formatına çevirir — Bakı saatı ilə, `actions.ts`-dəki `toIso()` ilə simmetrik.
 */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const baku = new Date(date.getTime() + 4 * 60 * 60 * 1000);
  return baku.toISOString().slice(0, 16);
}

export default async function AdminSystemModePage() {
  const { t, locale } = await getAdminI18n();
  // Səhifənin özü oxumadır: `SETTINGS_MANAGE` kifayətdir. Yazma qapısı
  // (`SUPER_ADMIN`) `actions.ts`-dədir — server action layout-dan keçmir.
  await requireAdminRead(PERMISSIONS.SETTINGS_MANAGE);

  const config = await getSystemModeConfig();
  const integrations = getIntegrationHealth();

  const initial: SystemModeFormValues = {
    mode: config.mode,
    titleAz: config.title.az,
    titleEn: config.title.en,
    titleRu: config.title.ru,
    descriptionAz: config.description.az,
    descriptionEn: config.description.en,
    descriptionRu: config.description.ru,
    expectedBackAt: toLocalInput(config.expectedBackAt),
    startAt: toLocalInput(config.startAt),
    endAt: toLocalInput(config.endAt),
    superAdminBypass: config.superAdminBypass,
    showCountdown: config.showCountdown,
  };

  const updatedAt = config.updatedAt
    ? new Intl.DateTimeFormat(LOCALE_TAGS[locale as Locale], {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Baku",
      }).format(new Date(config.updatedAt))
    : null;

  return (
    <>
      <AdminPageHeader
        title={t("pages.systemMode.title")}
        description={t("pages.systemMode.description")}
        breadcrumbs={[
          { label: t("pages.settings.idarePaneli"), href: "/admin" },
          { label: t("pages.systemMode.breadcrumb") },
        ]}
      />

      <div className="flex min-w-0 flex-col gap-6">
        <AdminCard
          title={t("pages.systemMode.statusTitle")}
          description={t("pages.systemMode.statusDescription")}
        >
          <div className="flex flex-wrap items-center gap-3">
            {/* `StatusBadge` yalnız məzmun statuslarını tanıyır; sistem rejimi
                öz `SYSTEM_MODE_TONE` xəritəsi ilə birbaşa `Badge`-ə verilir. */}
            <Badge tone={SYSTEM_MODE_TONE[config.mode]}>
              <span
                className="size-2 rounded-full bg-current"
                aria-hidden="true"
              />
              {t(`labels.systemMode.${config.mode}`)}
            </Badge>
            {updatedAt ? (
              <span className="text-xs text-ink-muted">{updatedAt}</span>
            ) : null}
          </div>

          {config.mode !== SYSTEM_MODES.NORMAL ? (
            <p className="mt-4 flex items-start gap-2.5 rounded-sm border border-warning/30 bg-warning-bg px-4 py-3 text-sm text-warning">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                {config.mode === SYSTEM_MODES.MAINTENANCE
                  ? t("pages.systemMode.modeMaintenanceHint")
                  : t("pages.systemMode.modeReadOnlyHint")}
              </span>
            </p>
          ) : null}
        </AdminCard>

        <AdminCard
          title={t("pages.systemMode.integrationHealthTitle")}
          description={t("pages.systemMode.integrationHealthDescription")}
        >
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {integrations.map((item) => (
              <li key={item.id} className="rounded-sm border border-line bg-beige/40 p-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-ink">
                    {t(INTEGRATION_LABEL_KEYS[item.id])}
                  </span>
                  <Badge tone={item.ready ? "success" : item.optional ? "warning" : "danger"}>
                    {item.ready
                      ? t("pages.systemMode.integrationReady")
                      : item.optional
                        ? t("pages.systemMode.integrationOptionalMissing")
                        : t("pages.systemMode.integrationRequiredMissing")}
                  </Badge>
                </div>
                {item.missing.length > 0 ? (
                  <code className="mt-2 block break-words text-[11px] leading-relaxed text-ink-muted">
                    {item.missing.join(", ")}
                  </code>
                ) : null}
              </li>
            ))}
          </ul>
        </AdminCard>

        <div className="grid grid-cols-1 min-w-0 gap-6 xl:grid-cols-[1.25fr_1fr]">
          <AdminCard
            title={t("pages.systemMode.contentTitle")}
            description={t("pages.systemMode.contentDescription")}
          >
            <SystemModeForm initial={initial} />
          </AdminCard>

          <AdminCard title={t("pages.systemMode.howTitle")}>
            <div className="flex min-w-0 flex-col gap-4 text-sm text-ink-soft">
              <p className="flex items-start gap-2.5">
                <Info className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                <span>{t("pages.systemMode.howGate")}</span>
              </p>
              <p className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                <span>{t("pages.systemMode.howBypass")}</span>
              </p>
              <p className="flex items-start gap-2.5">
                <Timer className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                <span>{t("pages.systemMode.howCache")}</span>
              </p>
              <p className="flex items-start gap-2.5">
                <Database className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                <span>{t("pages.systemMode.howAudit")}</span>
              </p>

              <div className="flex flex-col gap-2 border-t border-line pt-4">
                <p className="font-medium text-ink">{t("pages.systemMode.forcedTitle")}</p>
                <p className="text-xs text-ink-muted">{t("pages.systemMode.forcedHint")}</p>
                <code className="block overflow-x-auto rounded-xs bg-beige px-2 py-1 font-mono text-xs text-ink">
                  npx wrangler secret put FORCE_MAINTENANCE
                </code>
              </div>
            </div>
          </AdminCard>
        </div>
      </div>
    </>
  );
}
