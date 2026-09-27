"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cancelMyPackageOrder } from "./actions";

export function CancelOrderButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations("account.packages");

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      loading={pending}
      onClick={() => startTransition(async () => {
        const result = await cancelMyPackageOrder(id);
        if (result.message) toast(result.message, result.status === "success" ? "success" : "error");
        if (result.status === "success") router.refresh();
      })}
    >
      {t("cancel")}
    </Button>
  );
}
