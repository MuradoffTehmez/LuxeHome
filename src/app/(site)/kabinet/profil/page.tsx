import type { Metadata } from "next";
import { requireAccount } from "@/lib/auth/guard";
import { ACCOUNT_TYPES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";
import { PasswordForm, ProfileForm } from "./profile-forms";

export const metadata: Metadata = buildMetadata({
  title: "Profil",
  description: "Hesab məlumatlarınızı yeniləyin.",
  path: "/kabinet/profil",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function CabinetProfilePage() {
  const user = await requireAccount();
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
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl text-ink">Profil</h1>
        <p className="text-sm text-ink-soft">
          E-poçt dəyişdirilmir — dəyişiklik üçün bizimlə əlaqə saxlayın ({profile.email}).
        </p>
      </header>

      <section className="rounded-md border border-line bg-paper p-6">
        <h2 className="mb-5 font-display text-lg text-ink">Hesab məlumatları</h2>
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

      <section className="rounded-md border border-line bg-paper p-6">
        <h2 className="mb-5 font-display text-lg text-ink">Parol</h2>
        <PasswordForm />
      </section>
    </div>
  );
}
