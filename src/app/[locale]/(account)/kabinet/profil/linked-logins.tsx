"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import type { LinkableProvider } from "@/lib/auth/linked-logins-policy";
import { unlinkLogin } from "./linked-login-actions";

export type LinkedLoginRow = {
  provider: LinkableProvider;
  /** Provayder bu mühitdə qurulubmu (açarlar). Qurulmayıbsa yalnız mövcud bağlantını ayırmaq olar. */
  available: boolean;
  linked: boolean;
  detail: string | null;
  canUnlink: boolean;
};

const START: Record<LinkableProvider, string> = { GOOGLE: "google", APPLE: "apple", FACEBOOK: "facebook" };
const LABEL: Record<LinkableProvider, string> = { GOOGLE: "Google", APPLE: "Apple", FACEBOOK: "Facebook" };

/**
 * Kabinet → Profil → «Bağlı giriş üsulları». Bağlama tam səhifə OAuth yönləndirməsidir (`/api/auth/<provayder>/start?bagla=1`);
 * ayırma təsdiq dialoqundan sonra server action ilə. Son giriş yolu ayrıla bilmir.
 */
export function LinkedLogins({ rows, result }: { rows: LinkedLoginRow[]; result: { provider: string; outcome: string } | null }) {
  const t = useTranslations("account.profile.linkedLogins");
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<LinkableProvider | null>(null);
  const outcomeKey = result && ["linked", "already", "taken", "other", "mismatch", "failed"].includes(result.outcome) ? result.outcome : null;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-soft">{t("description")}</p>
      {outcomeKey ? (
        <p
          role={outcomeKey === "linked" || outcomeKey === "already" ? "status" : "alert"}
          className={`flex items-start gap-2 rounded-sm border px-4 py-3 text-sm ${outcomeKey === "linked" || outcomeKey === "already" ? "border-success/30 bg-success-bg text-success" : "border-danger/30 bg-danger-bg text-danger"}`}
        >
          {outcomeKey === "linked" || outcomeKey === "already" ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
          {t(`results.${outcomeKey as "linked"}`, { provider: LABEL[(result?.provider.toUpperCase() as LinkableProvider)] ?? "" })}
        </p>
      ) : null}
      <ul className="flex flex-col divide-y divide-line rounded-lg border border-line">
        {rows.map((row) => (
          <li key={row.provider} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-medium text-ink">{LABEL[row.provider]}</p>
              <p className="text-xs break-words text-ink-muted">{row.linked ? row.detail ?? t("linked") : row.available ? t("notLinked") : t("unavailable")}</p>
            </div>
            {row.linked ? (
              <Button type="button" variant="ghost" size="sm" disabled={pending || !row.canUnlink} title={row.canUnlink ? undefined : t("lastMethod")} onClick={() => setConfirm(row.provider)}>
                {t("unlink")}
              </Button>
            ) : row.available ? (
              <a
                href={`/api/auth/${START[row.provider]}/start?bagla=1&l=${locale}`}
                className="inline-flex min-h-11 items-center justify-center rounded-sm border border-line-strong px-4 text-sm font-medium text-ink transition-colors hover:border-gold hover:text-gold-deep"
                data-testid={`link-${START[row.provider]}`}
              >
                {t("link")}
              </a>
            ) : null}
          </li>
        ))}
      </ul>
      {rows.some((row) => row.linked && !row.canUnlink) ? <p className="text-xs text-ink-muted">{t("lastMethod")}</p> : null}

      <Modal
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={t("unlinkTitle", { provider: confirm ? LABEL[confirm] : "" })}
        description={t("unlinkDescription")}
        size="sm"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirm(null)}>{t("cancel")}</Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              loading={pending}
              onClick={() => {
                const provider = confirm;
                if (!provider) return;
                startTransition(async () => {
                  const result = await unlinkLogin(provider);
                  if (result.message) toast(result.message, result.status === "success" ? "success" : "error");
                  setConfirm(null);
                  router.refresh();
                });
              }}
            >
              {t("unlink")}
            </Button>
          </div>
        }
      />
    </div>
  );
}
