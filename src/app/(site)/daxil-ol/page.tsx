import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container, Section } from "@/components/ui/container";
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
    <Section spacing="cozy">
      <Container>
        <div className="mx-auto flex w-full max-w-md flex-col gap-6">
          <header className="flex flex-col gap-2 text-center">
            <h1 className="font-display text-3xl text-ink">Hesaba giriş</h1>
            <p className="text-sm text-ink-soft">
              Favoritlərinizi saxlamaq və elanlarınızı idarə etmək üçün daxil olun.
            </p>
          </header>

          <div className="rounded-md border border-line bg-paper p-6">
            <LoginForm next={next} />
          </div>
        </div>
      </Container>
    </Section>
  );
}
