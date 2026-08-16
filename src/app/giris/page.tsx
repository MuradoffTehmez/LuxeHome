import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { siteConfig } from "@/config/site";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Giriş",
  description: "LuxeHome idarə panelinə giriş.",
  // İdarə paneli axtarış sistemlərində görünməməlidir
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      {/* --- Sol: forma --- */}
      <div className="flex flex-col justify-center bg-ivory px-5 py-10 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <Link
            href="/"
            className="mb-10 inline-flex min-h-11 items-center gap-2 text-sm text-ink-soft transition-colors duration-200 hover:text-gold-deep"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Sayta qayıt
          </Link>

          <div className="mb-8 flex flex-col gap-2">
            <span className="font-display text-xl tracking-[0.18em] text-ink">
              LUXEHOME
            </span>
            <h1 className="font-display text-3xl text-ink">İdarə panelinə giriş</h1>
            <p className="text-sm text-ink-soft">
              Hesab məlumatlarınızı daxil edin. Giriş yalnız səlahiyyətli
              əməkdaşlar üçündür.
            </p>
          </div>

          <LoginForm />

          <div className="mt-8 flex items-start gap-2.5 rounded-xs border border-line bg-beige px-4 py-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-ink-soft">
              Bu səhifə hazırda dizayn mərhələsindədir — forma heç bir yerə
              göndərilmir. Doğrulama backend mərhələsində qoşulacaq.
            </p>
          </div>

          <p className="mt-8 text-xs text-ink-muted">
            © {new Date().getFullYear()} {siteConfig.legalName}. Sahibi:{" "}
            {siteConfig.owner.name}.
          </p>
        </div>
      </div>

      {/* --- Sağ: brend paneli (yalnız geniş ekranda) --- */}
      <div className="on-dark relative hidden lg:block">
        <Image
          src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=80"
          alt=""
          fill
          sizes="50vw"
          className="object-cover"
          priority
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-zinc-900/92 via-zinc-900/60 to-zinc-900/40"
        />
        <div className="relative flex h-full flex-col justify-end p-12 xl:p-16">
          <p className="max-w-md font-display text-3xl leading-tight text-white xl:text-4xl">
            {siteConfig.slogan}
          </p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
            {siteConfig.description}
          </p>
        </div>
      </div>
    </main>
  );
}
