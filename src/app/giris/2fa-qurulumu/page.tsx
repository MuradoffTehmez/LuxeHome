import type { Metadata } from "next";
import { redirect } from "next/navigation";
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
    <main className="flex min-h-dvh flex-col justify-center bg-ivory px-5 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-8 flex flex-col gap-2">
          <span className="font-display text-xl tracking-[0.18em] text-ink">LUXE HOME ESTATE</span>
          <h1 className="font-display text-3xl text-ink">İki mərhələli doğrulama</h1>
          <p className="text-sm text-ink-soft">
            Panelə giriş üçün doğrulama tətbiqi tələb olunur. QR kodu Google Authenticator,
            Microsoft Authenticator və ya oxşar tətbiqlə skan edin, sonra tətbiqdəki kodu yazın.
          </p>
        </div>

        <div className="mb-6 flex justify-center rounded-xs border border-line bg-paper p-6">
          <div
            aria-label="QR kod"
            // Server tərəfdə çəkilir — sirr kənar servisə göndərilmir
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
        </div>

        <details className="mb-6 rounded-xs border border-line bg-beige px-4 py-3">
          <summary className="min-h-11 cursor-pointer text-sm text-ink-soft">
            QR skan edilmirsə, açarı əl ilə yazın
          </summary>
          <code className="mt-2 block font-mono text-sm break-all text-ink">
            {enrollment.secret}
          </code>
        </details>

        <EnrollForm />
      </div>
    </main>
  );
}
