import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireUser } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: {
    default: "İdarə paneli",
    template: "%s | Luxe Home Estate idarə paneli",
  },
  // İdarə paneli heç vaxt indeksləşdirilməməlidir
  robots: { index: false, follow: false },
};

// Sessiya və sayğaclar D1-dən oxunur — binding yalnız sorğu kontekstindədir
export const dynamic = "force-dynamic";

/**
 * Admin panelin ümumi çərçivəsi və birinci qoruma həlqəsi.
 *
 * `requireUser()` sessiyanı bazadan yoxlayır — middleware-dəki imza yoxlaması
 * ləğv edilmiş sessiyanı görmür. Layout bütün panel səhifələrini əhatə edir,
 * amma server action-ları layout-dan keçmir: onlar öz guard-larını çağırır.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  // Müvəqqəti parolla gələn istifadəçi əvvəlcə onu dəyişməlidir.
  // Marşrut middleware-in qoyduğu başlıqdan oxunur — hesab səhifəsinin özündə
  // yönləndirmə təkrarlanmamalıdır, əks halda dövrə yaranır.
  const pathname = (await headers()).get("x-pathname") ?? "";
  if (user.mustChangePassword && !pathname.startsWith("/admin/hesabim")) {
    redirect("/admin/hesabim?parol=deyis");
  }

  const [newLeads, draftProperties] = await Promise.all([
    prisma.lead.count({ where: { status: "NEW" } }),
    prisma.property.count({ where: { status: "DRAFT", deletedAt: null } }),
  ]);

  return (
    <AdminShell user={user} counters={{ newLeads, draftProperties }}>
      {children}
    </AdminShell>
  );
}
