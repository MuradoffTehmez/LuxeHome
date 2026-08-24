import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { buildMetadata } from "@/lib/seo";
import { getOptionalUser } from "@/lib/auth/guard";
import { ACCOUNT_TYPES } from "@/lib/constants";
import { LoginForm } from "./login-form";

export const metadata: Metadata = buildMetadata({
  title: "Hesaba giriş",
  description: "Luxe Home Estate hesabınıza daxil olun — favoritlər, müraciətlər və elanlarınız.",
  path: "/daxil-ol",
  noIndex: true,
});

// Sessiya D1-dən oxunur — statik render mümkün deyil
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getOptionalUser();
  // Əməkdaş hesabı bura düşməməlidir — onun yeri paneldir
  if (user) redirect(user.accountType === ACCOUNT_TYPES.STAFF ? "/admin" : "/kabinet");

  const params = await searchParams;
  const next = typeof params.davam === "string" ? params.davam : undefined;

  return (
    <AuthShell
      eyebrow="Şəxsi kabinet"
      title="Hesaba giriş"
      description="Favoritlərinizi saxlamaq və elanlarınızı idarə etmək üçün daxil olun."
      aside={
        <div className="mx-auto max-w-lg">
          <p className="text-xs font-semibold tracking-[0.16em] text-gold-deep uppercase">
            Bir hesab, bütün seçimləriniz
          </p>
          <h2 className="mt-3 font-display text-4xl leading-tight text-ink">
            Əmlak axtarışınızı qaldığınız yerdən davam etdirin.
          </h2>
          <ul className="mt-7 flex flex-col gap-4 text-sm text-ink-soft">
            {["Favorit elanları saxlayın", "Müraciətlərinizi izləyin", "Öz elanlarınızı idarə edin"].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <CheckCircle2 className="size-5 shrink-0 text-gold-deep" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      }
    >
      <LoginForm next={next} />
    </AuthShell>
  );
}
