"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Overlay } from "@/components/ui/overlay";
import { CabinetNav } from "./cabinet-nav";

type CabinetShellProps = {
  name: string;
  accountLabel: string;
  canList: boolean;
  canManageTeam?: boolean;
  children: React.ReactNode;
};

export function CabinetShell({ name, accountLabel, canList, canManageTeam = false, children }: CabinetShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="mb-6 flex min-w-0 items-center justify-between gap-4 rounded-md border border-line bg-paper p-4 shadow-sm lg:hidden">
        <div className="min-w-0">
          <p className="text-xs tracking-wide text-ink-muted uppercase">{accountLabel}</p>
          <p className="mt-1 truncate font-medium text-ink">{name}</p>
        </div>
        <button
          type="button"
          aria-label="Kabinet menyusunu aç"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-xs border border-line-strong text-ink transition-colors hover:border-gold hover:text-gold-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
      </div>

      <div className="grid min-w-0 gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
          <CabinetNav name={name} accountLabel={accountLabel} canList={canList} canManageTeam={canManageTeam} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>

      <Overlay
        open={open}
        onClose={() => setOpen(false)}
        title="Kabinet menyusu"
        placement="left"
      >
        <CabinetNav
          name={name}
          accountLabel={accountLabel}
          canList={canList}
          canManageTeam={canManageTeam}
          variant="mobile"
          onNavigate={() => setOpen(false)}
        />
      </Overlay>
    </>
  );
}
