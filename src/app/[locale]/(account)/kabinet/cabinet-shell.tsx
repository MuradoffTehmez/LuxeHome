"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Menu } from "lucide-react";
import { Overlay } from "@/components/ui/overlay";
import type { CabinetNavItem } from "@/lib/accounts/cabinet-navigation";
import { CabinetNav } from "./cabinet-nav";
import { CabinetBreadcrumbs } from "./cabinet-breadcrumbs";

type CabinetShellProps = {
  name: string;
  accountLabel: string;
  canList: boolean;
  canManageTeam?: boolean;
  canTransfer?: boolean;
  canAssignListings?: boolean;
  canViewAnalytics?: boolean;
  hiddenItems?: readonly CabinetNavItem["id"][];
  unreadNotifications?: number;
  children: React.ReactNode;
};

export function CabinetShell({ name, accountLabel, canList, canManageTeam = false, canTransfer = false, canAssignListings = false, canViewAnalytics = false, hiddenItems = [], unreadNotifications = 0, children }: CabinetShellProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("auth.cabinet");

  return (
    <>
      <div className="no-print mb-4 flex min-w-0 items-center justify-between gap-4 rounded-xl border border-line bg-paper px-4 py-3 shadow-xs lg:hidden">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gold-deep">{accountLabel}</p>
          <p className="mt-1 truncate font-medium text-ink">{name}</p>
        </div>
        <button
          type="button"
          aria-label={t("openMenu")}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="relative inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-line-strong text-ink transition-colors hover:border-gold hover:text-gold-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          <Menu className="size-5" aria-hidden="true" />
          {unreadNotifications > 0 && <span aria-hidden="true" className="absolute top-1.5 right-1.5 size-2.5 rounded-full bg-gold ring-2 ring-paper" />}
        </button>
      </div>

      {/* Çap (#238): menyu gizlənir, məzmun tam enə keçir — analitika hesabatı «PDF kimi saxla» ilə çıxarılır. */}
      <div className="grid grid-cols-1 min-w-0 gap-8 lg:grid-cols-[248px_minmax(0,1fr)] print:block">
        <aside className="no-print hidden lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:block lg:max-h-[calc(100dvh-var(--header-h)-3rem)] lg:self-start lg:overflow-y-auto lg:pr-1 lg:[scrollbar-width:thin]">
          <CabinetNav name={name} accountLabel={accountLabel} canList={canList} canManageTeam={canManageTeam} canTransfer={canTransfer} canAssignListings={canAssignListings} canViewAnalytics={canViewAnalytics} hiddenItems={hiddenItems} unreadNotifications={unreadNotifications} />
        </aside>
        <div className="min-w-0">
          <CabinetBreadcrumbs />
          {children}
        </div>
      </div>

      <Overlay
        open={open}
        onClose={() => setOpen(false)}
        title={t("menu")}
        placement="left"
      >
        <CabinetNav
          name={name}
          accountLabel={accountLabel}
          canList={canList}
          canManageTeam={canManageTeam}
          canTransfer={canTransfer}
          canAssignListings={canAssignListings}
          canViewAnalytics={canViewAnalytics}
          hiddenItems={hiddenItems}
          unreadNotifications={unreadNotifications}
          variant="mobile"
          onNavigate={() => setOpen(false)}
        />
      </Overlay>
    </>
  );
}
