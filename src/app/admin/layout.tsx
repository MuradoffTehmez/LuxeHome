import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { mockStats } from "@/lib/admin-mock";

export const metadata: Metadata = {
  title: {
    default: "İdarə paneli",
    template: "%s | LuxeHome idarə paneli",
  },
  // İdarə paneli heç vaxt indeksləşdirilməməlidir
  robots: { index: false, follow: false },
};

/**
 * Admin panelin ümumi çərçivəsi.
 *
 * TODO: Backend mərhələsində bu layout sessiyanı yoxlamalı və giriş etməmiş
 *       istifadəçini `/giris` səhifəsinə yönləndirməlidir. Route səviyyəsində
 *       qoruma üçün ayrıca `middleware.ts` yazılacaq.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminShell
      counters={{
        newLeads: mockStats.newLeads,
        draftProperties: mockStats.draftProperties,
      }}
    >
      {children}
    </AdminShell>
  );
}
