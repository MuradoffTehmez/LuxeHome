import type { Metadata } from "next";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Building2, ShieldCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { ButtonLink } from "@/components/ui/button";
import { getOptionalUser } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { ACCOUNT_TYPES, AGENCY_EMPLOYEE_STATUSES, AUTH_KINDS, type Locale } from "@/lib/constants";
import { buildManagedMetadata } from "@/lib/seo";
import { localizePath } from "@/i18n/path-locale";
import { isUnoptimizedImage } from "@/lib/utils";
import { findAgencyByInviteToken } from "@/lib/accounts/agency-invite";
import { JoinAgencyForm } from "./join-form";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "account.join" });
  return buildManagedMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/qosul", noIndex: true, locale: locale as Locale });
}

/**
 * Agentliyin dəvət linki (#157). Qonaq üçün «Agent kimi qeydiyyat» (token qeydiyyat
 * formasına ötürülür) və «Daxil ol» (girişdən sonra bu səhifəyə qayıdır), daxil olmuş
 * agent üçün bir kliklə qoşulma. Token səhifədə yalnız gizli sahədədir; səhifə
 * indekslənmir və kənar keşə düşmür (`NEVER_CACHED_PREFIXES`).
 */
export default async function JoinAgencyPage({ params }: Props) {
  const { token } = await params;
  const locale = await getLocale() as Locale;
  const t = await getTranslations("account.join");
  const [agency, user] = await Promise.all([findAgencyByInviteToken(token), getOptionalUser(AUTH_KINDS.PUBLIC)]);

  if (!agency) {
    return (
      <AuthShell eyebrow={t("eyebrow")} title={t("invalidTitle")} description={t("invalid")}>
        <ButtonLink href={localizePath("/agentlikler", locale)} variant="outline" fullWidth>
          {t("browseAgencies")}
        </ButtonLink>
      </AuthShell>
    );
  }

  const membership = user
    ? await prisma.agencyEmployee.findUnique({
        where: { agencyId_userId: { agencyId: agency.id, userId: user.id } },
        select: { status: true },
      })
    : null;
  const selfPath = localizePath(`/qosul/${token}`, locale);

  return (
    <AuthShell eyebrow={t("eyebrow")} title={t("title", { name: agency.name })} description={t("description", { name: agency.name })}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4 rounded-lg border border-line bg-ivory p-4">
          <span className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg border border-gold-line bg-paper">
            {agency.logoUrl ? (
              <Image src={agency.logoUrl} alt={agency.name} fill sizes="64px" unoptimized={isUnoptimizedImage(agency.logoUrl)} className="object-contain" />
            ) : (
              <Building2 className="size-7 text-gold-deep" strokeWidth={1.5} aria-hidden="true" />
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate font-sans text-lg font-semibold text-ink">{agency.name}</p>
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-success">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              {t("verified")}
            </p>
          </div>
        </div>

        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-ink-soft">
          <li>{t("benefitBadge")}</li>
          <li>{t("benefitProfile")}</li>
          <li>{t("benefitLeave")}</li>
        </ul>

        {!user ? (
          <div className="flex flex-col gap-3">
            <ButtonLink href={`${localizePath("/qeydiyyat", locale)}?devet=${encodeURIComponent(token)}`} fullWidth>
              {t("register")}
            </ButtonLink>
            <ButtonLink
              href={`${localizePath("/daxil-ol", locale)}?davam=${encodeURIComponent(selfPath)}`}
              variant="outline"
              fullWidth
            >
              {t("login")}
            </ButtonLink>
          </div>
        ) : membership?.status === AGENCY_EMPLOYEE_STATUSES.APPROVED ? (
          <div className="flex flex-col gap-3">
            <p role="status" className="rounded-xs bg-success-bg px-4 py-3 text-sm text-success">{t("already", { name: agency.name })}</p>
            <ButtonLink href={localizePath("/kabinet/profil", locale)} variant="outline" fullWidth>{t("openCabinet")}</ButtonLink>
          </div>
        ) : user.accountType !== ACCOUNT_TYPES.AGENT ? (
          <p role="alert" className="rounded-xs bg-warning-bg px-4 py-3 text-sm text-ink-soft">{t("notAgent")}</p>
        ) : (
          <JoinAgencyForm token={token} agencyName={agency.name} />
        )}
      </div>
    </AuthShell>
  );
}
