import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";
import { requireAccount } from "@/lib/auth/guard";
import { ACCOUNT_TYPES, type Locale } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";
import { PasswordForm, ProfileForm } from "./profile-forms";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "account.profile" });
  return buildMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/kabinet/profil", noIndex: true, locale: locale as Locale });
}

export const dynamic = "force-dynamic";

export default async function CabinetProfilePage() {
  const user = await requireAccount();
  const t = await getTranslations("account.profile");
  const isAgency = user.accountType === ACCOUNT_TYPES.AGENCY;

  const [profile, agency] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { name: true, phone: true, email: true },
    }),
    isAgency
      ? prisma.agency.findUnique({
          where: { userId: user.id },
          select: { name: true, description: true, address: true, website: true, isVerified: true },
        })
      : null,
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        contained
        compact
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description", { email: profile.email })}
      />

      <section className="rounded-md border border-line bg-paper p-4 sm:p-6">
        <h2 className="mb-5 font-display text-lg text-ink">{t("accountInfo")}</h2>
        <ProfileForm
          name={profile.name}
          phone={profile.phone ?? ""}
          isAgency={isAgency}
          agency={
            agency
              ? {
                  name: agency.name,
                  description: agency.description ?? "",
                  address: agency.address ?? "",
                  website: agency.website ?? "",
                }
              : null
          }
        />
      </section>

      <section className="rounded-md border border-line bg-paper p-4 sm:p-6">
        <h2 className="mb-5 font-display text-lg text-ink">{t("passwordSection")}</h2>
        <PasswordForm />
      </section>
    </div>
  );
}
