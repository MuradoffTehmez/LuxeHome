import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { CompareBar } from "@/components/site/compare-bar";
import { ToastProvider } from "@/components/ui/toast";

/**
 * Hesab sistemi çərçivəsi (kabinet, daxil-ol, qeydiyyat).
 *
 * `[locale]/(site)/layout.tsx`-in eynisidir, amma hesab səhifələrinin ayrıca dinamik
 * qoruma və noindex qaydaları olduğu üçün ayrı saxlanılır.
 */
export default function AccountLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ToastProvider>
      <div className="flex min-h-dvh flex-col">
        <Navbar showLocaleSwitcher />
        <main id="main" className="flex-1 pt-[var(--header-h)]">
          {children}
        </main>
        <Footer />
        <CompareBar />
      </div>
    </ToastProvider>
  );
}
