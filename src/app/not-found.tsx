import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Səhifə tapılmadı",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center bg-ivory text-ink">
      <Container>
        <div className="mx-auto max-w-xl py-20 text-center">
          <p className="font-serif text-6xl text-gold sm:text-7xl">404</p>
          <h1 className="mt-6 font-serif text-3xl text-ink sm:text-4xl">
            Axtardığınız səhifə tapılmadı
          </h1>
          <p className="mt-4 text-ink-soft">
            Səhifə silinmiş, adı dəyişmiş və ya ünvan səhv yazılmış ola bilər.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/">Ana səhifə</ButtonLink>
            <ButtonLink href="/emlaklar" variant="outline">
              Əmlaklara bax
            </ButtonLink>
          </div>
        </div>
      </Container>
    </main>
  );
}
