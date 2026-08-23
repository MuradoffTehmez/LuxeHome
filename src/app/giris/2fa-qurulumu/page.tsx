import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { prisma } from "@/lib/prisma";
import { readEnrollmentSecret } from "@/lib/auth/enrollment";
import { buildOtpauthUri, renderQrSvg } from "@/lib/auth/totp";
import { EnrollForm } from "./enroll-form";

export const metadata: Metadata = {
  title: "İki mərhələli doğrulamanın qurulması",
  robots: { index: false, follow: false },
};

// Ara-cookie və baza yalnız sorğu kontekstində əlçatandır
export const dynamic = "force-dynamic";

export default async function EnrollPage() {
  const enrollment = await readEnrollmentSecret();
  if (!enrollment) redirect("/giris");

  const user = await prisma.user.findUnique({
    where: { id: enrollment.uid },
    select: { email: true },
  });
  if (!user) redirect("/giris");

  const qrSvg = renderQrSvg(buildOtpauthUri(enrollment.secret, user.email));

  return (
    <AuthShell
      standalone
      eyebrow="Təhlükəsizlik qurulumu"
      title="İki mərhələli doğrulama"
      description="QR kodu doğrulama tətbiqi ilə skan edin, sonra tətbiqdə görünən kodu yazın."
      aside={
        <div className="mx-auto max-w-md">
          <KeyRound className="size-10 text-gold-deep" aria-hidden="true" />
          <h2 className="mt-5 font-display text-3xl text-ink">Sirr cihazınızda qalır</h2>
          <p className="mt-3 text-sm leading-6 text-ink-soft">
            QR kod serverdə yaradılır; doğrulama sirri heç bir xarici xidmətə göndərilmir.
          </p>
        </div>
      }
    >

        <div className="mb-6 flex max-w-full justify-center overflow-x-auto rounded-xs border border-line bg-paper p-4 sm:p-6">
          <div
            aria-label="QR kod"
            className="max-w-full [&_svg]:h-auto [&_svg]:max-w-full"
            // Server tərəfdə çəkilir — sirr kənar servisə göndərilmir
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
        </div>

        <details className="mb-6 max-w-full overflow-x-auto rounded-xs border border-line bg-beige px-4 py-2">
          <summary className="flex min-h-11 cursor-pointer items-center text-sm text-ink-soft">
            QR skan edilmirsə, açarı əl ilə yazın
          </summary>
          <code className="mt-2 block font-mono text-sm break-all text-ink">
            {enrollment.secret}
          </code>
        </details>

        <EnrollForm />
    </AuthShell>
  );
}
