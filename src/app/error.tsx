"use client";

import { useEffect } from "react";
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
  useEffect(() => {
    console.error("Səhifə xətası:", error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] items-center bg-ivory text-ink">
      <Container>
        <div className="mx-auto max-w-xl py-20 text-center">
          <h1 className="font-serif text-3xl text-ink sm:text-4xl">
            Gözlənilməz xəta baş verdi
          </h1>
          <p className="mt-4 text-ink-soft">
            Zəhmət olmasa səhifəni yeniləyin. Problem davam edərsə bizimlə əlaqə saxlayın.
          </p>
          {error.digest ? (
            <p className="mt-3 text-xs text-ink-muted">Xəta kodu: {error.digest}</p>
          ) : null}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button onClick={reset}>Yenidən cəhd et</Button>
            <ButtonLink href="/elaqe" variant="outline">
              Əlaqə
            </ButtonLink>
          </div>
        </div>
      </Container>
    </main>
  );
}
