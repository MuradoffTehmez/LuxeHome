"use client";

import { useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { Button, ButtonLink } from "@/components/ui/button";

/**
 * Gözlənilməz server/klient xətası üçün ehtiyat ekran.
 * Xəta mətni istifadəçiyə göstərilmir — yalnız `digest` (Cloudflare loglarında axtarmaq üçün).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations("common.globalError");
  const prefix = locale === "az" ? "" : `/${locale}`;
  useEffect(() => {
    console.error("Səhifə xətası:", error);
    void fetch("/api/monitoring/error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message || error.name,
        digest: error.digest,
        path: window.location.pathname,
        source: "global-error",
      }),
      keepalive: true,
    });
  }, [error]);

  return (
    <main className="flex min-h-[70vh] items-center bg-ivory text-ink">
      <Container>
        <div className="mx-auto max-w-xl py-20 text-center">
          <h1 className="font-serif text-3xl text-ink sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-4 text-ink-soft">
            {t("description")}
          </p>
          {error.digest ? (
            <p className="mt-3 text-xs text-ink-muted">{t("code", { code: error.digest })}</p>
          ) : null}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button onClick={reset}>{t("retry")}</Button>
            <ButtonLink href={`${prefix}/elaqe`} variant="outline">
              {t("contact")}
            </ButtonLink>
          </div>
        </div>
      </Container>
    </main>
  );
}
