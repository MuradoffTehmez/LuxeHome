"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, Clock, MapPin, Phone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { IDLE_STATE, type ActionState } from "@/lib/admin/action-state";
import { MAX_AGENCY_OFFICES } from "@/lib/constants";
import { addAgencyOffice, removeAgencyOffice } from "./office-actions";

export type CabinetOffice = {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  workingHours: string | null;
  cityName: string | null;
};

function StateMessage({ state }: { state: ActionState }) {
  if (state.status === "idle" || !state.message) return null;
  const error = state.status === "error";
  const Icon = error ? AlertCircle : CheckCircle2;
  return (
    <p
      role={error ? "alert" : "status"}
      className={
        error
          ? "flex min-w-0 items-start gap-2.5 rounded-xs border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger [overflow-wrap:anywhere]"
          : "flex min-w-0 items-start gap-2.5 rounded-xs border border-success/30 bg-success-bg px-4 py-3 text-sm text-success [overflow-wrap:anywhere]"
      }
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {state.message}
    </p>
  );
}

/**
 * Agentliyin filialları (#157): siyahı + əlavə forması. Baş ofis profil formasındakı
 * «Ünvan» sahəsidir; burada yalnız əlavə ofislər. Filiallar agentlik profilinin
 * «Ofislərimiz» bölməsində görünür, nömrə «Nömrəni göstər» ilə açılır.
 */
export function OfficeManager({
  offices,
  cities,
}: {
  offices: CabinetOffice[];
  cities: { value: string; label: string }[];
}) {
  const t = useTranslations("account.offices");
  const [state, formAction, pending] = useActionState(addAgencyOffice, IDLE_STATE);
  const formRef = useRef<HTMLFormElement>(null);
  const full = offices.length >= MAX_AGENCY_OFFICES;

  // Uğurlu əlavədən sonra forma təmizlənir — növbəti filialı yazmaq üçün.
  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <div className="flex flex-col gap-6">
      {offices.length > 0 ? (
        <ul className="divide-y divide-line rounded-lg border border-line">
          {offices.map((office) => (
            <li key={office.id} className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{office.name}</p>
                <p className="mt-1 flex items-start gap-1.5 text-sm text-ink-soft">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-gold-deep" aria-hidden="true" />
                  <span className="[overflow-wrap:anywhere]">{[office.cityName, office.address].filter(Boolean).join(", ")}</span>
                </p>
                {(office.phone || office.workingHours) && (
                  <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
                    {office.phone && (
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="size-3.5" aria-hidden="true" />
                        <span className="tabular">{office.phone}</span>
                      </span>
                    )}
                    {office.workingHours && (
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="size-3.5" aria-hidden="true" />
                        {office.workingHours}
                      </span>
                    )}
                  </p>
                )}
              </div>
              <ConfirmAction
                action={removeAgencyOffice}
                id={office.id}
                label={t("removeLabel", { name: office.name })}
                title={t("removeTitle")}
                description={t("removeDescription", { name: office.name })}
                confirmLabel={t("remove")}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </ConfirmAction>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-muted">{t("empty")}</p>
      )}

      {full ? (
        <p className="text-sm text-ink-muted">{t("limit", { count: MAX_AGENCY_OFFICES })}</p>
      ) : (
        <form
          ref={formRef}
          // `action` propu React 19-da forma göndəriləndən sonra sahələri həmişə sıfırlayır —
          // xətada yazılan ad və ünvan itirdi. Əl ilə göndərilir, sıfırlama yalnız uğurdadır.
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            startTransition(() => formAction(data));
          }}
          className="flex flex-col gap-4 border-t border-line pt-6"
          noValidate
        >
          <h3 className="font-sans text-base font-semibold text-ink">{t("addTitle")}</h3>
          <StateMessage state={state} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input name="officeName" label={t("name")} placeholder={t("namePlaceholder")} required maxLength={120} error={state.fieldErrors?.officeName} />
            <Select
              name="officeCityId"
              label={t("city")}
              placeholder={t("cityPlaceholder")}
              options={cities}
              error={state.fieldErrors?.officeCityId}
            />
          </div>
          <Input name="officeAddress" label={t("address")} required maxLength={240} error={state.fieldErrors?.officeAddress} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              name="officePhone"
              label={t("phone")}
              type="tel"
              placeholder="+994 XX XXX XX XX"
              maxLength={30}
              error={state.fieldErrors?.officePhone}
            />
            <Input
              name="officeHours"
              label={t("hours")}
              hint={t("hoursHint")}
              maxLength={120}
              error={state.fieldErrors?.officeHours}
            />
          </div>
          <Button type="submit" variant="outline" loading={pending} className="w-full sm:w-fit">
            {t("add")}
          </Button>
        </form>
      )}
    </div>
  );
}
