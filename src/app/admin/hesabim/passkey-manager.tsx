"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Fingerprint, KeyRound, Trash2 } from "lucide-react";
import { browserSupportsWebAuthn, startRegistration } from "@simplewebauthn/browser";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { useServerMessage } from "@/components/admin/use-server-message";
import { useToast } from "@/components/ui/toast";
import { beginPasskeyRegistration, deletePasskey, finishPasskeyRegistration } from "./passkey-actions";

type PasskeyItem = { id: string; name: string; createdAt: string; lastUsedAt: string | null; synced: boolean };

/** Passkey siyahısı və əlavə etmə (#109). Tarixlər serverdə formatlanıb gəlir. */
export function PasskeyManager({ passkeys }: { passkeys: PasskeyItem[] }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const { toast } = useToast();
  const translate = useServerMessage();
  const [supported, setSupported] = useState(true);
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setSupported(browserSupportsWebAuthn());
  }, []);

  function add() {
    startTransition(async () => {
      const started = await beginPasskeyRegistration();
      if (started.status === "error") {
        toast(translate(started.message) ?? started.message, "error");
        return;
      }
      let response;
      try {
        response = await startRegistration({ optionsJSON: started.options });
      } catch {
        toast(t("pages.account.passkeyCancelled"), "error");
        return;
      }
      const result = await finishPasskeyRegistration(response, name);
      if (result.message) toast(translate(result.message) ?? result.message, result.status === "success" ? "success" : "error");
      if (result.status === "success") {
        setName("");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-soft">{t("pages.account.passkeyHint")}</p>

      {passkeys.length > 0 ? (
        <ul className="divide-y divide-line rounded-sm border border-line">
          {passkeys.map((passkey) => (
            <li key={passkey.id} className="flex min-w-0 items-center gap-3 p-3">
              <KeyRound className="size-4 shrink-0 text-gold-deep" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{passkey.name}</p>
                <p className="text-xs text-ink-muted">
                  {t("pages.account.passkeyAdded", { date: passkey.createdAt })}
                  {" · "}
                  {passkey.lastUsedAt ? t("pages.account.passkeyLastUsed", { date: passkey.lastUsedAt }) : t("pages.account.passkeyNeverUsed")}
                  {passkey.synced ? ` · ${t("pages.account.passkeySynced")}` : ""}
                </p>
              </div>
              <ConfirmAction
                action={deletePasskey}
                id={passkey.id}
                title={t("pages.account.passkeyDeleteTitle")}
                description={t("pages.account.passkeyDeleteDescription", { name: passkey.name })}
                confirmLabel={t("pages.account.passkeyDelete")}
                label={t("pages.account.passkeyDeleteLabel", { name: passkey.name })}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </ConfirmAction>
            </li>
          ))}
        </ul>
      ) : null}

      {supported ? (
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
          <input
            value={name}
            onChange={(event) => setName(event.target.value.slice(0, 60))}
            maxLength={60}
            aria-label={t("pages.account.passkeyName")}
            placeholder={t("pages.account.passkeyNamePlaceholder")}
            className="min-h-11 min-w-0 flex-1 rounded-xs border border-line-strong bg-paper px-3 text-sm text-ink"
          />
          <button
            type="button"
            onClick={add}
            disabled={pending}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xs bg-gold px-4 text-sm font-semibold text-on-gold hover:bg-gold-soft disabled:opacity-50"
          >
            <Fingerprint className="size-4" aria-hidden="true" />
            {t("pages.account.passkeyAdd")}
          </button>
        </div>
      ) : (
        <p className="text-sm text-warning">{t("pages.account.passkeyUnsupported")}</p>
      )}
    </div>
  );
}
