import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { getOptionalUser } from "@/lib/auth/guard";
import { ACCOUNT_TYPES } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = buildMetadata({
  title: "Qeydiyyat",
  description: "Luxe Home Estate hesabı yaradın və elanlarınızı idarə edin.",
  path: "/qeydiyyat",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getOptionalUser();
  if (user) redirect(user.accountType === ACCOUNT_TYPES.STAFF ? "/admin" : "/kabinet");

  const params = await searchParams;
  const next = typeof params.davam === "string" ? params.davam : undefined;

  return (
    <AuthShell
      eyebrow="Yeni hesab"
      title="Hesab yaradın"
      description="Favoritlərinizi, müraciətlərinizi və elanlarınızı bir yerdən idarə edin."
      aside={
        <div className="mx-auto max-w-lg">
          <p className="text-xs font-semibold tracking-[0.16em] text-gold-deep uppercase">
            Sizə uyğun kabinet
          </p>
          <h2 className="mt-3 font-display text-4xl leading-tight text-ink">
            Alıcı, mülk sahibi və ya agentlik kimi başlayın.
          </h2>
          <ul className="mt-7 flex flex-col gap-4 text-sm text-ink-soft">
            {["Hesab növünü özünüz seçin", "Məlumatlarınızı təhlükəsiz saxlayın", "Elan prosesini bir yerdən izləyin"].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <CheckCircle2 className="size-5 shrink-0 text-gold-deep" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      }
    >
      <RegisterForm next={next} />
    </AuthShell>
  );
}
