import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
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
    <AuthShell
      standalone
      eyebrow="İkinci mərhələ"
      title="Doğrulama kodu"
      description="Doğrulama tətbiqindəki 6 rəqəmli kodu yazın. Cihazınız əlinizdə deyilsə, ehtiyat kodlarınızdan birini istifadə edin."
      aside={
        <div className="mx-auto max-w-md rounded-md border border-line bg-paper/70 p-8">
          <ShieldCheck className="size-10 text-gold-deep" aria-hidden="true" />
          <h2 className="mt-5 font-display text-3xl text-ink">Hesabınız qorunur</h2>
          <p className="mt-3 text-sm leading-6 text-ink-soft">
            Doğrulama kodu yalnız qısa müddət etibarlıdır və hər girişdə yenilənir.
          </p>
        </div>
      }
    >
      <VerifyForm />
    </AuthShell>
  );
}
