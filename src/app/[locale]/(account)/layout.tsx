import { Navbar } from "@/components/site/navbar";
import { getHiddenPublicPaths } from "@/lib/site-sections";
import { Footer } from "@/components/site/footer";
import { CompareBar } from "@/components/site/compare-bar";
import { ToastProvider } from "@/components/ui/toast";
import { AdminSharedMessages } from "./admin-shared-messages";

/**
 * Hesab sistemi çərçivəsi (kabinet, daxil-ol, qeydiyyat).
 *
 * `[locale]/(site)/layout.tsx`-in eynisidir, amma hesab səhifələrinin ayrıca dinamik
 * qoruma və noindex qaydaları olduğu üçün ayrı saxlanılır.
 *
 * Kabinet formaları paneldəki ortaq komponentləri işlədir — onların mesajları
 * `AdminSharedMessages` ilə gəlir.
 */
export default async function AccountLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AdminSharedMessages>
      <ToastProvider>
        <div className="flex min-h-dvh flex-col">
          <Navbar showLocaleSwitcher hiddenPaths={await getHiddenPublicPaths()} />
          <main id="main" className="flex-1 pt-[var(--header-h)]">
            {children}
          </main>
          <Footer />
          <CompareBar />
        </div>
      </ToastProvider>
    </AdminSharedMessages>
  );
}
