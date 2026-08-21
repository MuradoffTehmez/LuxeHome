import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readStageCookie, verifyStageToken } from "@/lib/auth/cookies";
import { VerifyForm } from "./verify-form";

export const metadata: Metadata = {
  title: "Doğrulama",
  robots: { index: false, follow: false },
};

// Ara-cookie yalnız sorğu kontekstində oxunur
export const dynamic = "force-dynamic";

export default async function VerifyPage() {
  const token = await readStageCookie();
  const claims = token ? await verifyStageToken(token) : null;
  if (!claims || claims.stage !== "totp") redirect("/giris");

  return (
    <main className="flex min-h-dvh flex-col justify-center bg-ivory px-5 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 flex flex-col gap-2">
          <span className="font-display text-xl tracking-[0.18em] text-ink">LUXE HOME ESTATE</span>
          <h1 className="font-display text-3xl text-ink">Doğrulama kodu</h1>
          <p className="text-sm text-ink-soft">
            Doğrulama tətbiqindəki 6 rəqəmli kodu yazın. Cihazınız əlinizdə deyilsə,
            ehtiyat kodlarınızdan birini istifadə edin.
          </p>
        </div>

        <VerifyForm />
      </div>
    </main>
  );
}
