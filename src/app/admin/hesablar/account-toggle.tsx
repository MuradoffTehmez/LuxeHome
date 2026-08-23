"use client";

import { Power, PowerOff } from "lucide-react";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { togglePublicAccountActive } from "./actions";

export function AccountToggle({
  id,
  name,
  isActive,
  className,
}: {
  id: string;
  name: string;
  isActive: boolean;
  className?: string;
}) {
  return (
    <ConfirmAction
      action={togglePublicAccountActive}
      id={id}
      label={isActive ? `«${name}» hesabını deaktiv et` : `«${name}» hesabını aktivləşdir`}
      title={isActive ? "Hesabı deaktiv etmək" : "Hesabı aktivləşdirmək"}
      description={
        isActive
          ? "Hesab dərhal girişi itirəcək və bütün açıq sessiyaları bağlanacaq."
          : "Hesab yenidən giriş edə biləcək."
      }
      confirmLabel={isActive ? "Deaktiv et" : "Aktivləşdir"}
      tone={isActive ? "danger" : "neutral"}
      className={className}
    >
      {isActive ? (
        <PowerOff className="size-4" aria-hidden="true" />
      ) : (
        <Power className="size-4" aria-hidden="true" />
      )}
    </ConfirmAction>
  );
}
