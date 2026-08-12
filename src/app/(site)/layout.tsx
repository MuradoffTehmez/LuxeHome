import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { ToastProvider } from "@/components/ui/toast";

/**
 * İctimai saytın çərçivəsi.
 * Admin panel ayrı route qrupundadır və bu layout-u istifadə etmir.
 *
 * Header `fixed` olduğu üçün `<main>`-ə `pt-[--header-h]` əlavə olunur.
 * Ana səhifənin hero-su bu padding-i mənfi margin ilə neytrallaşdırır.
 */
export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ToastProvider>
      <div className="flex min-h-dvh flex-col">
        <Navbar />
        <main id="main" className="flex-1 pt-[var(--header-h)]">
          {children}
        </main>
        <Footer />
      </div>
    </ToastProvider>
  );
}
