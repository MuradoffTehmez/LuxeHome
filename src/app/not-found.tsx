"use client";

import { useLocale, useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  const locale = useLocale();
  const t = useTranslations("common.notFound");
  const prefix = locale === "az" ? "" : `/${locale}`;
  return (
    <main className="flex min-h-[70vh] items-center bg-ivory text-ink">
      <Container>
        <div className="mx-auto max-w-xl py-20 text-center">
          <p className="font-serif text-6xl text-gold sm:text-7xl">404</p>
          <h1 className="mt-6 font-serif text-3xl text-ink sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-4 text-ink-soft">
            {t("description")}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href={`${prefix}/`}>{t("home")}</ButtonLink>
            <ButtonLink href={`${prefix}/emlaklar`} variant="outline">
              {t("properties")}
            </ButtonLink>
          </div>
        </div>
      </Container>
    </main>
  );
}
