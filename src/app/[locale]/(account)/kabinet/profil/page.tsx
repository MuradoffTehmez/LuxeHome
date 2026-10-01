import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";
import { requireAccount } from "@/lib/auth/guard";
import { Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { formatLocalizedDate } from "@/i18n/date";
import { accountTypeKey, ACCOUNT_TYPES, type Locale } from "@/lib/constants";
import { profileRequirements, splitName } from "@/lib/accounts/profile-fields";
import { prisma } from "@/lib/prisma";
import { buildManagedMetadata } from "@/lib/seo";
import { ThemeSelector } from "@/components/site/theme-selector";
import { AccountDataForm, PasswordForm, ProfileForm } from "./profile-forms";
import { PhoneVerification } from "./phone-verification";
import { isSmsConfigured } from "@/lib/sms";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "account.profile" });
  return buildManagedMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/kabinet/profil", noIndex: true, locale: locale as Locale });
}

export const dynamic = "force-dynamic";

export default async function CabinetProfilePage() {
  const locale = await getLocale() as Locale;
  const user = await requireAccount(locale);
  const t = await getTranslations("account.profile");
  const accountT = await getTranslations("auth.accountTypes");
  const isAgency = user.accountType === ACCOUNT_TYPES.AGENCY;
  const requirements = profileRequirements(user.accountType);

  const [profile, agency, agent, listingCount] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: {
        name: true,
        phone: true,
        email: true,
        verifiedPhone: true,
        avatarUrl: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        companyName: true,
        companyTaxId: true,
        companyWebsite: true,
        position: true,
        createdAt: true,
      },
    }),
    isAgency
      ? prisma.agency.findUnique({
          where: { userId: user.id },
          select: { name: true, slug: true, description: true, address: true, website: true, isVerified: true },
        })
      : null,
    requirements.agent
      ? prisma.agentProfile.findUnique({
          where: { userId: user.id },
          select: { slug: true, roleTitle: true, specialization: true, experienceYears: true, bio: true, isPublic: true, isVerified: true },
        })
      : null,
    prisma.property.count({ where: { authorId: user.id, deletedAt: null } }),
  ]);

  // Köhnə hesablarda ad/soyad ayrıca yazılmayıb — tək addan bölünür.
  const names = profile.firstName || profile.lastName
    ? { firstName: profile.firstName ?? "", lastName: profile.lastName ?? "" }
    : splitName(profile.name);
  const companyName = profile.companyName ?? agency?.name ?? "";
  const verified = isAgency ? agency?.isVerified : requirements.agent ? agent?.isVerified : null;
  const publicHref = isAgency && agency?.isVerified
    ? `/agentlikler/${agency.slug}`
    : agent?.isPublic
      ? `/agentler/${agent.slug}`
      : null;
  const initials = `${names.firstName.charAt(0)}${names.lastName.charAt(0)}`.toLocaleUpperCase("az-AZ") || "LH";

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        contained
        compact
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description", { email: profile.email })}
      />

      {/* Profil kartı — hesabın ictimai görünüşünə yaxın, korporativ təqdimat. */}
      <section className="flex flex-col gap-5 rounded-xl border border-line bg-paper p-5 shadow-xs sm:flex-row sm:items-center sm:p-6">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-full border border-line bg-beige">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- /media/ URL-ləri optimizasiyadan keçmir
            <img src={profile.avatarUrl} alt={profile.name} className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center font-display text-2xl text-gold-deep" aria-hidden="true">
              {initials}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-sans text-xl font-semibold text-ink">{profile.name}</h2>
            <Badge tone="gold">{accountT(accountTypeKey(user.accountType))}</Badge>
            {verified != null && (
              <Badge tone={verified ? "success" : "warning"}>{verified ? t("verified") : t("pending")}</Badge>
            )}
          </div>
          {(companyName || profile.position) && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
              <Building2 className="size-4 shrink-0" aria-hidden="true" />
              {[profile.position, companyName].filter(Boolean).join(" · ")}
            </p>
          )}
          <p className="mt-1 text-sm text-ink-muted">
            {t("memberSince", { date: formatLocalizedDate(profile.createdAt, locale, "monthYear") ?? "" })}
            {listingCount > 0 ? ` · ${t("listingsCount", { count: listingCount })}` : ""}
          </p>
          {requirements.agent && (
            <p className="mt-1 text-sm text-ink-muted">{agent?.isPublic ? t("agentPublicLive") : t("agentPublicPending")}</p>
          )}
        </div>
        {publicHref && (
          <Link
            href={publicHref}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-sm border border-line-strong px-4 text-sm font-medium text-ink transition-colors hover:border-gold hover:text-gold-deep"
          >
            {t("viewPublicProfile")}
          </Link>
        )}
      </section>

      <section className="rounded-xl border border-line bg-paper p-4 sm:p-6 shadow-xs">
        <h2 className="mb-5 font-display text-lg text-ink">{t("accountInfo")}</h2>
        <ProfileForm
          isAgency={isAgency}
          requirements={requirements}
          values={{
            ...names,
            phone: profile.phone ?? "",
            birthDate: profile.birthDate ? profile.birthDate.toISOString().slice(0, 10) : "",
            avatarUrl: profile.avatarUrl,
            companyName,
            companyTaxId: profile.companyTaxId ?? "",
            companyWebsite: profile.companyWebsite ?? agency?.website ?? "",
            position: profile.position ?? "",
            agencyDescription: agency?.description ?? "",
            agencyAddress: agency?.address ?? "",
            agentRoleTitle: agent?.roleTitle ?? "",
            agentSpecialization: agent?.specialization ?? "",
            agentExperience: agent?.experienceYears != null ? String(agent.experienceYears) : "",
            agentBio: agent?.bio ?? "",
          }}
        />
      </section>

      {isSmsConfigured() ? (
        <section className="rounded-xl border border-line bg-paper p-4 sm:p-6 shadow-xs">
          <h2 className="mb-3 font-display text-lg text-ink">{t("phoneSection")}</h2>
          <PhoneVerification verifiedPhone={profile.verifiedPhone} currentPhone={profile.phone ?? ""} />
        </section>
      ) : null}

      <section className="rounded-xl border border-line bg-paper p-4 sm:p-6 shadow-xs">
        <h2 className="font-display text-lg text-ink">{t("appearanceSection")}</h2>
        <p className="mt-1 mb-5 max-w-2xl text-sm leading-6 text-ink-soft">
          {t("appearanceDescription")}
        </p>
        <ThemeSelector className="max-w-md" />
      </section>

      <section className="rounded-xl border border-line bg-paper p-4 sm:p-6 shadow-xs">
        <h2 className="mb-5 font-display text-lg text-ink">{t("dataSection")}</h2>
        <AccountDataForm />
      </section>

      <section className="rounded-xl border border-line bg-paper p-4 sm:p-6 shadow-xs">
        <h2 className="mb-5 font-display text-lg text-ink">{t("passwordSection")}</h2>
        <PasswordForm />
      </section>
    </div>
  );
}
