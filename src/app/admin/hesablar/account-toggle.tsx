"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations("admin");
  return (
    <ConfirmAction
      action={togglePublicAccountActive}
      id={id}
      label={isActive ? t("pages.common.hesabiniDeaktivEt", { p0: name }) : t("pages.common.hesabiniAktivlesdir", { p0: name })}
      title={isActive ? t("pages.misc.hesabiDeaktivEtmek") : t("pages.misc.hesabiAktivlesdirmek")}
      description={
        isActive
          ? t("pages.misc.hesabDerhalGirisiItirecek")
          : t("pages.misc.hesabYenidenGirisEde")
      }
      confirmLabel={isActive ? "Deaktiv et" : t("pages.misc.aktivlesdir")}
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
