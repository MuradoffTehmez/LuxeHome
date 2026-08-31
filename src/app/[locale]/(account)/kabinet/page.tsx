import type { Metadata } from "next";
import { Building2, ClipboardList, ShieldCheck } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { getCabinetSummary } from "@/lib/accounts/cabinet-summary";
import { requireAccount } from "@/lib/auth/guard";
import { ACCOUNT_TYPES, type Locale } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { buildManagedMetadata } from "@/lib/seo";
import { localizePath } from "@/i18n/path-locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "auth.cabinet" });
  return buildManagedMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/kabinet", noIndex: true, locale: locale as Locale });
}

export default async function CabinetPage() {
  const locale = await getLocale() as Locale;
  const user = await requireAccount(locale);
  const summary = await getCabinetSummary(
    {
      countProperties: (userId) =>
        prisma.property.count({ where: { authorId: userId, deletedAt: null } }),
      findAgency: (userId) =>
        prisma.agency.findUnique({
          where: { userId },
          select: { name: true, isVerified: true },
        }),
    },
    user,
  );

  const canList = user.accountType !== ACCOUNT_TYPES.USER;
  const t = await getTranslations("auth.cabinet");
  const accountT = await getTranslations("auth.accountTypes");
  const accountTypeKey = user.accountType === ACCOUNT_TYPES.USER ? "user" : user.accountType === ACCOUNT_TYPES.OWNER ? "owner" : user.accountType === ACCOUNT_TYPES.AGENCY ? "agency" : "staff";

  return (
    <div className="flex min-w-0 flex-col gap-8">
          <PageHeader
            contained
            compact
            eyebrow={t("eyebrow")}
            title={t("greeting", { name: user.name })}
            description={user.email}
            actions={
            <Badge tone="gold" className="w-fit">
              {accountT(accountTypeKey)}
            </Badge>
            }
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-md border border-line bg-paper p-5">
              <ClipboardList className="size-5 text-gold-deep" aria-hidden="true" />
              <p className="mt-5 text-sm text-ink-soft">{t("yourListings")}</p>
              <p className="mt-1 font-display text-3xl text-ink">{summary.propertyCount}</p>
              <p className="mt-2 text-sm text-ink-soft">
                {canList
                  ? t("listingCountDescription")
                  : t("listingPermissionHint")}
              </p>
              {canList && (
                <ButtonLink
                  href={localizePath("/kabinet/elanlar", locale)}
                  variant="ghost"
                  size="sm"
                  className="mt-4 self-start px-0 text-gold-deep hover:text-ink"
                >
                  {t("manageListings")} →
                </ButtonLink>
              )}
            </article>

            {user.accountType === ACCOUNT_TYPES.AGENCY && (
              <article className="rounded-md border border-line bg-paper p-5">
                <Building2 className="size-5 text-gold-deep" aria-hidden="true" />
                <p className="mt-5 text-sm text-ink-soft">{t("agencyProfile")}</p>
                <p className="mt-1 font-display text-xl text-ink">
                  {summary.agency?.name ?? t("profileMissing")}
                </p>
                <div className="mt-3">
                  <Badge tone={summary.agency?.isVerified ? "success" : "warning"}>
                    <ShieldCheck className="size-3.5" aria-hidden="true" />
                    {summary.agency?.isVerified ? t("verified") : t("verificationPending")}
                  </Badge>
                </div>
              </article>
            )}
          </div>
    </div>
  );
}
