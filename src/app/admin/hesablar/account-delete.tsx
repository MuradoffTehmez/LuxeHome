"use client";

import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { deletePublicAccount } from "./actions";

/** İctimai hesabı (və ya agentliyi) silmə düyməsi — «Hesablar» və «Agentliklər» işlədir. */
export function AccountDelete({ id, name, className }: { id: string; name: string; className?: string }) {
  const t = useTranslations("admin");
  return (
    <ConfirmAction
      action={deletePublicAccount}
      id={id}
      label={t("components.accountDelete.label", { name })}
      title={t("components.accountDelete.title")}
      description={t("components.accountDelete.description", { name })}
      confirmLabel={t("components.accountDelete.confirm")}
      tone="danger"
      className={className}
    >
      <Trash2 className="size-4" aria-hidden="true" />
    </ConfirmAction>
  );
}
