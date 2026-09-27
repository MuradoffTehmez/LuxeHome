"use client";

import { useTranslations } from "next-intl";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Check } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { IDLE_STATE } from "@/lib/admin/action-state";
import { PAYMENT_METHODS } from "@/lib/constants";
import { useLocalizedActionState } from "@/components/admin/use-server-message";
import { recordPayment } from "./actions";

function Submit() {
  const t = useTranslations("admin");
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="inline-flex min-h-11 items-center gap-1.5 rounded-sm bg-gold px-4 text-sm font-semibold text-on-gold hover:bg-gold-soft disabled:opacity-50">
      <Check className="size-4" aria-hidden="true" />
      {t("pages.packages.markPaid")}
    </button>
  );
}

/** Gözləyən sifariş üçün ödəniş qeydi: üsul + (istəyə bağlı) qəbz/köçürmə nömrəsi. */
export function PaymentForm({ id }: { id: string }) {
  const t = useTranslations("admin");
  const [rawState, action] = useActionState(recordPayment, IDLE_STATE);
  const state = useLocalizedActionState(rawState);
  const { toast } = useToast();
  useEffect(() => {
    if (state.message) toast(state.message, state.status === "success" ? "success" : "error");
  }, [state, toast]);

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <select name="paymentMethod" aria-label={t("pages.packages.method")} defaultValue={PAYMENT_METHODS.CASH} className="min-h-11 rounded-sm border border-line-strong bg-paper px-3 text-sm text-ink">
        {Object.values(PAYMENT_METHODS).map((method) => (
          <option key={method} value={method}>{t(`labels.paymentMethod.${method}`)}</option>
        ))}
      </select>
      <input name="paymentReference" maxLength={120} aria-label={t("pages.packages.reference")} placeholder={t("pages.packages.referencePlaceholder")} className="min-h-11 w-full min-w-0 rounded-sm border border-line-strong bg-paper px-3 text-sm text-ink sm:w-44" />
      <Submit />
    </form>
  );
}
