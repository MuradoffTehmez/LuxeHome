"use client";

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
  return (
    <ConfirmAction
      action={togglePublicAccountApproval}
      id={id}
      label={approved ? `«${name}» hesabının təsdiqini ləğv et` : `«${name}» hesabını təsdiqlə`}
      title={approved ? "Hesab təsdiqini ləğv etmək" : "Hesabı təsdiqləmək"}
      description={
        approved
          ? "Hesab aktiv qala bilər, amma admin yoxlamasından keçmiş statusunu itirəcək."
          : "Hesab admin tərəfindən yoxlanılmış kimi işarələnəcək. Bu əməliyyat e-poçt doğrulaması deyil."
      }
      confirmLabel={approved ? "Təsdiqi ləğv et" : "Təsdiqlə"}
      tone={approved ? "danger" : "neutral"}
      className={className}
    >
      {approved ? <BadgeX className="size-4" aria-hidden="true" /> : <BadgeCheck className="size-4" aria-hidden="true" />}
    </ConfirmAction>
  );
}
