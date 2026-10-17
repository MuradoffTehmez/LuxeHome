"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Contact, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import type { ActionState } from "@/lib/admin/action-state";
import { CRM_NOTE_MAX, LISTING_TYPES, RENOVATIONS } from "@/lib/constants";
import type { CrmFormOptions } from "@/lib/accounts/crm";
import {
  addClientNote,
  createClient,
  createClientFromLead,
  deleteClient,
  reassignClient,
  updateClient,
  type CrmActionState,
} from "./actions";

export type ClientFormValues = {
  name: string;
  phone: string;
  email: string;
  listingType: string;
  type: string;
  city: string;
  district: string;
  priceMin: string;
  priceMax: string;
  areaMin: string;
  areaMax: string;
  rooms: string;
  renovation: string;
  preferences: string;
};

export const EMPTY_CLIENT: ClientFormValues = {
  name: "", phone: "", email: "", listingType: "", type: "", city: "", district: "",
  priceMin: "", priceMax: "", areaMin: "", areaMax: "", rooms: "", renovation: "", preferences: "",
};

const INITIAL: CrmActionState = { status: "idle" };

/**
 * Müştəri kartının forması (#226, PRD 9.1, 9.2): əlaqə məlumatı və ehtiyaclar. Yeni kartda
 * uğurdan sonra karta keçir, redaktədə səhifəni yeniləyir.
 */
export function ClientForm({ id, options, initial }: { id?: string; options: CrmFormOptions; initial: ClientFormValues }) {
  const t = useTranslations("account.clients");
  const router = useRouter();
  const { toast } = useToast();
  const [state, action, pending] = useActionState(id ? updateClient : createClient, INITIAL);
  const [city, setCity] = useState(initial.city);

  useEffect(() => {
    if (state.status === "idle") return;
    toast(state.message ?? t("errors.failed"), state.status === "success" ? "success" : "error");
    if (state.status !== "success") return;
    if (!id && state.clientId) router.push(`/kabinet/musteriler/${state.clientId}`);
    else router.refresh();
  }, [state, id, router, t, toast]);

  // Rayon siyahısı seçilmiş şəhərdən: inzibati rayon və onun qəsəbələri bir qrupda.
  const districts = useMemo(() => {
    const selected = options.cities.find((item) => item.slug === city);
    if (!selected) return [];
    return selected.children.flatMap((child) => [
      { value: child.slug, label: child.name },
      ...child.children.map((leaf) => ({ value: leaf.slug, label: leaf.name, group: child.name })),
    ]);
  }, [city, options.cities]);

  const error = (name: string) => state.fieldErrors?.[name];
  const renovationKeys = Object.values(RENOVATIONS);

  return (
    <form action={action} className="flex flex-col gap-6">
      {id && <input type="hidden" name="id" value={id} />}
      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <legend className="mb-3 font-sans text-base font-semibold text-ink">{t("form.contactTitle")}</legend>
        <Input name="name" label={t("form.name")} defaultValue={initial.name} required maxLength={120} error={error("name")} className="sm:col-span-2" />
        <Input name="phone" type="tel" label={t("form.phone")} defaultValue={initial.phone} maxLength={40} error={error("phone")} />
        <Input name="email" type="email" label={t("form.email")} defaultValue={initial.email} maxLength={200} error={error("email")} />
      </fieldset>

      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <legend className="mb-3 font-sans text-base font-semibold text-ink">{t("form.needsTitle")}</legend>
        <Select
          name="listingType"
          label={t("form.listingType")}
          defaultValue={initial.listingType}
          placeholder={t("form.any")}
          options={[
            { value: LISTING_TYPES.SALE, label: t("listingTypes.SALE") },
            { value: LISTING_TYPES.RENT, label: t("listingTypes.RENT") },
          ]}
        />
        <Select
          name="type"
          label={t("form.type")}
          defaultValue={initial.type}
          placeholder={t("form.any")}
          options={options.types.map((item) => ({ value: item.slug, label: item.name }))}
        />
        <Select
          name="rooms"
          label={t("form.rooms")}
          defaultValue={initial.rooms}
          placeholder={t("form.any")}
          options={[1, 2, 3, 4, 5].map((value) => ({ value: String(value), label: value === 5 ? "5+" : String(value) }))}
        />
        <Select
          name="city"
          label={t("form.city")}
          value={city}
          onChange={(event) => setCity(event.target.value)}
          placeholder={t("form.any")}
          options={options.cities.map((item) => ({ value: item.slug, label: item.name }))}
        />
        <Select
          key={city}
          name="district"
          label={t("form.district")}
          defaultValue={city === initial.city ? initial.district : ""}
          placeholder={city ? t("form.any") : t("form.cityFirst")}
          disabled={!city || districts.length === 0}
          options={districts}
        />
        <Select
          name="renovation"
          label={t("form.renovation")}
          defaultValue={initial.renovation}
          placeholder={t("form.any")}
          options={renovationKeys.map((value) => ({ value, label: t(`renovations.${value}`) }))}
        />
        <div className="grid grid-cols-2 gap-4 sm:col-span-2">
          <Input name="priceMin" type="number" inputMode="numeric" min={0} label={t("form.priceMin")} defaultValue={initial.priceMin} error={error("priceMin")} />
          <Input name="priceMax" type="number" inputMode="numeric" min={0} label={t("form.priceMax")} defaultValue={initial.priceMax} error={error("priceMax")} />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:col-span-2">
          <Input name="areaMin" type="number" inputMode="numeric" min={0} label={t("form.areaMin")} defaultValue={initial.areaMin} error={error("areaMin")} />
          <Input name="areaMax" type="number" inputMode="numeric" min={0} label={t("form.areaMax")} defaultValue={initial.areaMax} error={error("areaMax")} />
        </div>
        <Textarea
          name="preferences"
          label={t("form.preferences")}
          hint={t("form.preferencesHint")}
          defaultValue={initial.preferences}
          maxLength={2000}
          rows={3}
          className="sm:col-span-2"
        />
      </fieldset>
      <div>
        <Button type="submit" loading={pending}>{id ? t("form.save") : t("form.create")}</Button>
      </div>
    </form>
  );
}

function useRun() {
  const t = useTranslations("account.clients");
  const { toast } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const run = (action: () => Promise<ActionState>, onSuccess?: (result: ActionState) => void) =>
    startTransition(async () => {
      const result = await action().catch((): ActionState => ({ status: "error", message: t("errors.failed") }));
      toast(result.message ?? t("errors.failed"), result.status === "success" ? "success" : "error");
      if (result.status === "success") {
        if (onSuccess) onSuccess(result);
        else router.refresh();
      }
    });
  return { pending, run, router };
}

/** Daxili qeyd — yalnız kartı görənlərə görünür. */
export function ClientNoteForm({ id }: { id: string }) {
  const t = useTranslations("account.clients");
  const { pending, run, router } = useRun();
  const [text, setText] = useState("");
  return (
    <div className="flex flex-col gap-2">
      <Textarea label={t("notes.new")} hint={t("notes.hint")} value={text} onChange={(event) => setText(event.target.value)} maxLength={CRM_NOTE_MAX} rows={3} />
      <div>
        <Button
          size="sm"
          loading={pending}
          disabled={text.trim().length < 2}
          onClick={() => run(() => addClientNote(id, text), () => { setText(""); router.refresh(); })}
        >
          {t("notes.add")}
        </Button>
      </div>
    </div>
  );
}

/** Məsul seçimi — agentlik sahibi və müraciət idarəetmə səlahiyyətli menecer. */
export function ClientOwnerSelect({ id, ownerId, assignees }: { id: string; ownerId: string; assignees: { userId: string; name: string }[] }) {
  const t = useTranslations("account.clients");
  const { pending, run } = useRun();
  const [value, setValue] = useState(ownerId);
  return (
    <div className="flex flex-wrap items-end gap-2">
      <Select
        label={t("card.owner")}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        options={assignees.map((item) => ({ value: item.userId, label: item.name }))}
        className="min-w-48 flex-1"
      />
      <Button size="sm" variant="outline" loading={pending} disabled={value === ownerId} onClick={() => run(() => reassignClient(id, value))}>
        {t("card.reassign")}
      </Button>
    </div>
  );
}

/** Kartı silmək — təsdiq dialoqu ilə; bağlı müraciətlər qalır. */
export function DeleteClientButton({ id, name }: { id: string; name: string }) {
  const t = useTranslations("account.clients");
  const { pending, run, router } = useRun();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" variant="ghost" className="border border-line text-danger" onClick={() => setOpen(true)}>
        <Trash2 className="size-4" aria-hidden="true" />
        {t("card.delete")}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("card.deleteTitle")}
        description={t("card.deleteDescription", { name })}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>{t("card.cancel")}</Button>
            <Button
              variant="danger"
              loading={pending}
              onClick={() => run(() => deleteClient(id), () => router.push("/kabinet/musteriler"))}
            >
              {t("card.confirmDelete")}
            </Button>
          </div>
        }
      >
        <span className="sr-only">{name}</span>
      </Modal>
    </>
  );
}

/** Müraciət kartından müştəri kartı yaratmaq (#226) — uğurda yeni karta keçir. */
export function CreateClientFromLeadButton({ leadId }: { leadId: string }) {
  const t = useTranslations("account.clients");
  const { pending, run, router } = useRun();
  return (
    <Button
      size="sm"
      variant="outline"
      loading={pending}
      onClick={() =>
        run(() => createClientFromLead(leadId), (result) => {
          const clientId = (result as CrmActionState).clientId;
          if (clientId) router.push(`/kabinet/musteriler/${clientId}`);
        })
      }
    >
      <Contact className="size-4" aria-hidden="true" />
      {t("fromLead")}
    </Button>
  );
}
