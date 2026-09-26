"use client";

import { useActionState, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Checkbox, Input, Textarea } from "@/components/ui/field";
import { SYSTEM_MODES, type SystemMode } from "@/lib/constants";
import { IDLE_STATE } from "@/lib/admin/action-state";
import { saveSystemMode } from "./actions";
import { useLocalizedActionState } from "@/components/admin/use-server-message";

/**
 * Sistem rejimi forması.
 *
 * `AdminForm` qəsdən istifadə olunmur: o, göndərməni birbaşa edir, burada isə
 * rejim dəyişikliyi **təsdiq dialoqundan** keçməlidir. Dialoq yalnız rejim
 * dəyişəndə çıxır — yalnız mətn redaktəsi üçün əlavə klik tələb etmək
 * lazımsız sürtünmədir.
 */

export type SystemModeFormValues = {
  mode: SystemMode;
  titleAz: string;
  titleEn: string;
  titleRu: string;
  descriptionAz: string;
  descriptionEn: string;
  descriptionRu: string;
  /** `datetime-local` üçün hazırlanmış `YYYY-MM-DDTHH:mm` sətri. */
  expectedBackAt: string;
  startAt: string;
  endAt: string;
  superAdminBypass: boolean;
  showCountdown: boolean;
};

const MODE_ORDER: SystemMode[] = [
  SYSTEM_MODES.NORMAL,
  SYSTEM_MODES.MAINTENANCE,
  SYSTEM_MODES.READ_ONLY,
];

const MODE_DOT: Record<SystemMode, string> = {
  NORMAL: "bg-success",
  MAINTENANCE: "bg-danger",
  READ_ONLY: "bg-warning",
};

export function SystemModeForm({ initial }: { initial: SystemModeFormValues }) {
  const t = useTranslations("admin");
  const [rawState, formAction, pending] = useActionState(saveSystemMode, IDLE_STATE);
  const state = useLocalizedActionState(rawState);
  const formRef = useRef<HTMLFormElement>(null);
  const [mode, setMode] = useState<SystemMode>(initial.mode);
  const [confirming, setConfirming] = useState(false);
  /**
   * Təsdiqdən sonrakı proqramlı göndərişin bayrağı.
   *
   * `confirming` state-i istifadə edilə bilməz: `setConfirming(false)` yeni
   * render planlaşdırır və `requestSubmit()` işə düşəndə `handleSubmit` artıq
   * `confirming === false` görür — nəticədə forma yenidən dayandırılıb dialoq
   * təkrar açılırdı. Ref render dövründən asılı deyil.
   */
  const confirmedRef = useRef(false);

  const modeHint: Record<SystemMode, string> = {
    NORMAL: t("pages.systemMode.modeNormalHint"),
    MAINTENANCE: t("pages.systemMode.modeMaintenanceHint"),
    READ_ONLY: t("pages.systemMode.modeReadOnlyHint"),
  };

  const confirmMessage: Record<SystemMode, string> = {
    NORMAL: t("pages.systemMode.confirmNormal"),
    MAINTENANCE: t("pages.systemMode.confirmMaintenance"),
    READ_ONLY: t("pages.systemMode.confirmReadOnly"),
  };

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    // Rejim dəyişmirsə, yaxud dəyişiklik artıq təsdiqlənibsə forma birbaşa gedir.
    if (mode === initial.mode || confirmedRef.current) {
      confirmedRef.current = false;
      return;
    }
    event.preventDefault();
    setConfirming(true);
  }

  function confirmAndSubmit() {
    confirmedRef.current = true;
    setConfirming(false);
    // `requestSubmit()` HTML validasiyasını və `action`-ı normal yolla işə salır;
    // `submit()` isə `onSubmit` handler-ini yan keçərdi.
    formRef.current?.requestSubmit();
  }

  return (
    <>
      <form
        ref={formRef}
        action={formAction}
        onSubmit={handleSubmit}
        className="flex min-w-0 flex-col gap-6"
        noValidate
      >
        <input type="hidden" name="mode" value={mode} />

        {state.status === "error" && state.message ? (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-sm border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{state.message}</span>
          </div>
        ) : null}

        {state.status === "success" && state.message ? (
          <div
            role="status"
            className="flex items-start gap-2.5 rounded-sm border border-success/30 bg-success-bg px-4 py-3 text-sm text-success"
          >
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{state.message}</span>
          </div>
        ) : null}

        <fieldset className="flex min-w-0 flex-col gap-3">
          <legend className="mb-1 text-sm font-medium text-ink">
            {t("pages.systemMode.modeTitle")}
          </legend>

          {MODE_ORDER.map((value) => (
            <label
              key={value}
              className={`flex min-w-0 cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
                mode === value
                  ? "border-gold bg-gold/8"
                  : "border-line hover:border-line-strong"
              }`}
            >
              <input
                type="radio"
                name="modeChoice"
                value={value}
                checked={mode === value}
                onChange={() => setMode(value)}
                className="mt-1 size-4 shrink-0 cursor-pointer accent-[--color-gold]"
              />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <span
                    className={`size-2 rounded-full ${MODE_DOT[value]}`}
                    aria-hidden="true"
                  />
                  {t(`labels.systemMode.${value}`)}
                </span>
                <span className="text-sm text-ink-soft">{modeHint[value]}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <div className="grid grid-cols-1 min-w-0 gap-4 sm:grid-cols-2">
          <Input
            name="titleAz"
            label={`${t("pages.systemMode.fieldTitle")} (AZ)`}
            defaultValue={initial.titleAz}
            maxLength={160}
          />
          <Input
            name="titleEn"
            label={`${t("pages.systemMode.fieldTitle")} (EN)`}
            defaultValue={initial.titleEn}
            maxLength={160}
          />
          <Input
            name="titleRu"
            label={`${t("pages.systemMode.fieldTitle")} (RU)`}
            defaultValue={initial.titleRu}
            maxLength={160}
          />
          <div className="hidden sm:block" aria-hidden="true" />

          <div className="sm:col-span-2">
            <Textarea
              name="descriptionAz"
              label={`${t("pages.systemMode.fieldDescription")} (AZ)`}
              defaultValue={initial.descriptionAz}
              maxLength={600}
              rows={3}
            />
          </div>
          <div className="sm:col-span-2">
            <Textarea
              name="descriptionEn"
              label={`${t("pages.systemMode.fieldDescription")} (EN)`}
              defaultValue={initial.descriptionEn}
              maxLength={600}
              rows={3}
            />
          </div>
          <div className="sm:col-span-2">
            <Textarea
              name="descriptionRu"
              label={`${t("pages.systemMode.fieldDescription")} (RU)`}
              defaultValue={initial.descriptionRu}
              maxLength={600}
              rows={3}
            />
          </div>

          <Input
            name="startAt"
            type="datetime-local"
            label={t("pages.systemMode.fieldStartAt")}
            defaultValue={initial.startAt}
          />
          <Input
            name="endAt"
            type="datetime-local"
            label={t("pages.systemMode.fieldEndAt")}
            defaultValue={initial.endAt}
            hint={t("pages.systemMode.fieldCountdownHint")}
          />
          <Input
            name="expectedBackAt"
            type="datetime-local"
            label={t("pages.systemMode.fieldExpectedBackAt")}
            defaultValue={initial.expectedBackAt}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-1">
          <Checkbox
            name="superAdminBypass"
            label={t("pages.systemMode.fieldBypass")}
            defaultChecked={initial.superAdminBypass}
          />
          <p className="pl-8 text-xs text-ink-muted">{t("pages.systemMode.fieldBypassHint")}</p>

          <Checkbox
            name="showCountdown"
            label={t("pages.systemMode.fieldCountdown")}
            defaultChecked={initial.showCountdown}
          />
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {t("pages.systemMode.submit")}
          </Button>
        </div>
      </form>

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title={t("pages.systemMode.confirmTitle")}
        description={confirmMessage[mode]}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              {t("pages.systemMode.confirmCancel")}
            </Button>
            <Button onClick={confirmAndSubmit}>{t("pages.systemMode.confirmAccept")}</Button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">
          {t(`labels.systemMode.${initial.mode}`)} → {t(`labels.systemMode.${mode}`)}
        </p>
      </Modal>
    </>
  );
}
