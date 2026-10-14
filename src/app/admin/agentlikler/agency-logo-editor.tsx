"use client";

import { useTranslations } from "next-intl";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { LogoPicker } from "@/components/auth/logo-picker";
import { IDLE_STATE } from "@/lib/admin/action-state";
import { useLocalizedActionState } from "@/components/admin/use-server-message";
import { removeAgencyLogo, updateAgencyLogo } from "./actions";

/** Panel: agentlik loqosu — açılan blok, sətrin hündürlüyünü dəyişmir. */
export function AgencyLogoEditor({ agencyId, name, logoUrl }: { agencyId: string; name: string; logoUrl: string | null }) {
  const t = useTranslations("admin");
  const [rawState, action, pending] = useActionState(updateAgencyLogo, IDLE_STATE);
  const state = useLocalizedActionState(rawState);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!state.message) return;
    toast(state.message, state.status === "success" ? "success" : "error");
    if (state.status === "success") router.refresh();
  }, [router, state, toast]);

  return (
    <details className="group mt-2">
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 text-xs font-medium text-gold-deep [&::-webkit-details-marker]:hidden">
        <span className="relative grid size-8 place-items-center overflow-hidden rounded-xs border border-line bg-paper">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- panel önizləməsi, 32 px
            <img src={logoUrl} alt="" className="size-full object-contain" />
          ) : (
            <Building2 className="size-4 text-ink-muted" aria-hidden="true" />
          )}
        </span>
        {t("pages.agents.loqo")}
      </summary>
      <form action={action} className="mt-2 flex flex-col gap-3 rounded-sm border border-line p-3">
        <input type="hidden" name="agencyId" value={agencyId} />
        <LogoPicker
          name="logo"
          error={state.fieldErrors?.logo}
          labels={{
            label: t("pages.agents.loqo"),
            hint: t("pages.agents.loqoIpucu"),
            choose: t("pages.agents.loqoSec"),
            change: t("pages.agents.loqoDeyis"),
            remove: t("pages.agents.loqoLegv"),
            invalid: t("pages.agents.loqoSehv"),
            tooLarge: t("pages.agents.loqoBoyuk"),
          }}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" size="sm" loading={pending} className="min-h-11">
            {t("pages.agents.loqoYaddaSaxla")}
          </Button>
          {logoUrl && (
            <ConfirmAction
              action={removeAgencyLogo}
              id={agencyId}
              label={t("pages.agents.loqoSil")}
              title={t("pages.agents.loqoSil")}
              description={t("pages.agents.loqoSilTesvir", { p0: name })}
              confirmLabel={t("pages.agents.loqoSil")}
              tone="danger"
              className="min-h-11 px-3 text-xs"
            >
              {t("pages.agents.loqoSil")}
            </ConfirmAction>
          )}
        </div>
      </form>
    </details>
  );
}
