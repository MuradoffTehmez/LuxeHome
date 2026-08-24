import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { CompareBar } from "@/components/site/compare-bar";
import { ToastProvider } from "@/components/ui/toast";

/**
 * Hesab sistemi çərçivəsi (kabinet, daxil-ol, qeydiyyat).
 *
 * `[locale]/(site)/layout.tsx`-in eynisidir, amma qəsdən ayrıdır: hesab səhifələri
 * dil prefiksindən kənarda qalır (həmişə `/kabinet`, heç vaxt `/en/kabinet`), çünki
 * middleware-dəki sessiya yönləndirmə məntiqi (`session-routing.ts`) bu yollara sərt
 * bağlıdır — lokallaşdırma bu sahəyə toxunmamalıdır.
 */
export default function AccountLayout({
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
        <CompareBar />
      </div>
    </ToastProvider>
  );
}
