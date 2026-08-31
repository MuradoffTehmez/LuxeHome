"use client";

import { useTranslations } from "next-intl";
import { BadgeCheck, BadgeX } from "lucide-react";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { togglePublicAccountApproval } from "./actions";

export function AccountApproval({
  id,
  name,
  approved,
  className,
}: {
  id: string;
  name: string;
  approved: boolean;
  className?: string;
}) {
  const t = useTranslations("admin");
  return (
    <ConfirmAction
      action={togglePublicAccountApproval}
      id={id}
      label={approved ? t("pages.common.hesabininTesdiqiniLegvEt", { p0: name }) : t("pages.common.hesabiniTesdiqle", { p0: name })}
      title={approved ? t("pages.misc.hesabTesdiqiniLegvEtmek") : t("pages.misc.hesabiTesdiqlemek")}
      description={
        approved
          ? t("pages.misc.hesabAktivQalaBiler")
          : t("pages.misc.hesabAdminTerefindenYoxlanilmis")
      }
      confirmLabel={approved ? t("pages.misc.tesdiqiLegvEt") : t("pages.misc.tesdiqle")}
      tone={approved ? "danger" : "neutral"}
      className={className}
    >
      {approved ? <BadgeX className="size-4" aria-hidden="true" /> : <BadgeCheck className="size-4" aria-hidden="true" />}
    </ConfirmAction>
  );
}
