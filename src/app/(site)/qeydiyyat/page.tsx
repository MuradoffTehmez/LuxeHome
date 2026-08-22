import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container, Section } from "@/components/ui/container";
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
    <Section spacing="cozy">
      <Container>
        <div className="mx-auto flex w-full max-w-md flex-col gap-6">
          <header className="flex flex-col gap-2 text-center">
            <h1 className="font-display text-3xl text-ink">Hesab yaradın</h1>
            <p className="text-sm text-ink-soft">
              Favoritlərinizi, müraciətlərinizi və elanlarınızı bir yerdən idarə edin.
            </p>
          </header>

          <div className="rounded-md border border-line bg-paper p-6">
            <RegisterForm next={next} />
          </div>
        </div>
      </Container>
    </Section>
  );
}
