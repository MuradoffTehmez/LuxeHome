"use client";

import { useTranslations } from "next-intl";
import { AdminForm, FormSection } from "@/components/admin/form-shell";
import { AdminInput, AdminSelect, AdminTextarea, FullWidth } from "@/components/admin/form-fields";
import { ImageDropzone } from "@/components/admin/image-dropzone";
import { saveAgentProfile } from "./actions";

export type AgentFormValues = {
  id: string;
  name: string;
  slug: string;
  userId: string;
  agencyId: string;
  roleTitle: string;
  specialization: string;
  experienceYears: string;
  phone: string;
  whatsapp: string;
  email: string;
  languages: string;
  areas: string;
  bio: string;
  soldCount: string;
  rentedCount: string;
  responseMinutes: string;
  avatarUrl: string | null;
  isVerified: boolean;
  isPublic: boolean;
};

export const EMPTY_AGENT_FORM: AgentFormValues = {
  id: "",
  name: "",
  slug: "",
  userId: "",
  agencyId: "",
  roleTitle: "",
  specialization: "",
  experienceYears: "",
  phone: "",
  whatsapp: "",
  email: "",
  languages: "",
  areas: "",
  bio: "",
  soldCount: "0",
  rentedCount: "0",
  responseMinutes: "",
  avatarUrl: null,
  isVerified: false,
  isPublic: false,
};

type Option = { id: string; label: string };

/**
 * Agent profilinin yaratma və redaktə forması.
 *
 * Tək komponent hər iki halı örtür: `initial.id` boşdursa action yeni profil yaradır.
 * Əvvəl yalnız yaratma forması vardı — səhv yazılmış telefon və ya bio-nu düzəltmək
 * mümkün deyildi, çünki heç bir yeniləmə axını yox idi.
 */
export function AgentForm({
  initial,
  users,
  agencies,
}: {
  initial: AgentFormValues;
  users: Option[];
  agencies: Option[];
}) {
  const t = useTranslations("admin");
  return (
    <AdminForm action={saveAgentProfile} submitLabel={initial.id ? "Dəyişiklikləri saxla" : "Agent yarat"} className="gap-4">
      <input type="hidden" name="id" value={initial.id} />

      <FormSection title={t("pages.agents.profil")} description={t("pages.agents.ictimaiAgentKataloqundaVe")}>
        <AdminInput name="name" label={t("pages.agents.adVeSoyad")} defaultValue={initial.name} required maxLength={120} />
        <AdminInput name="slug" label={t("pages.agents.urlAdi")} defaultValue={initial.slug} placeholder="ad-soyad" maxLength={100} hint={t("pages.agents.bosBuraxilsaAddanYaradilir")} />
        <AdminSelect
          name="userId"
          label={t("pages.agents.bagliHesab")}
          defaultValue={initial.userId}
          options={[{ value: "", label: t("pages.agents.baglanmayib") }, ...users.map((user) => ({ value: user.id, label: user.label }))]}
        />
        <AdminSelect
          name="agencyId"
          label={t("pages.agents.agentlik")}
          defaultValue={initial.agencyId}
          options={[{ value: "", label: t("pages.agents.musteqil") }, ...agencies.map((agency) => ({ value: agency.id, label: agency.label }))]}
        />
        <AdminInput name="roleTitle" label={t("pages.agents.vezife")} defaultValue={initial.roleTitle} maxLength={120} />
        <AdminInput name="specialization" label={t("pages.agents.ixtisaslasma")} defaultValue={initial.specialization} maxLength={200} />
        <FullWidth>
          <ImageDropzone
            name="avatar"
            label={t("pages.agents.profilSekli")}
            folder="umumi"
            mode="single"
            initial={initial.avatarUrl ? [{ url: initial.avatarUrl, alt: "", isCover: true }] : []}
          />
        </FullWidth>
        <FullWidth>
          <AdminTextarea name="bio" label={t("pages.agents.bio")} defaultValue={initial.bio} rows={5} maxLength={3000} />
        </FullWidth>
      </FormSection>

      <FormSection title={t("pages.agents.elaqe")} description={t("pages.agents.elanSehifesindekiAgentKarti")}>
        <AdminInput name="phone" label={t("pages.agents.telefon")} defaultValue={initial.phone} maxLength={40} />
        <AdminInput name="whatsapp" label={t("pages.agents.whatsapp")} defaultValue={initial.whatsapp} maxLength={40} />
        <AdminInput name="email" label={t("pages.agents.ePoct")} type="email" defaultValue={initial.email} maxLength={200} />
        <AdminTextarea name="languages" label={t("pages.agents.diller")} defaultValue={initial.languages} rows={4} hint={t("pages.agents.herSetirdeBiri")} />
        <AdminTextarea name="areas" label={t("pages.agents.eraziler")} defaultValue={initial.areas} rows={4} hint={t("pages.agents.herSetirdeBiri")} />
      </FormSection>

      <FormSection
        title={t("pages.agents.gostericiler")}
        description={t("pages.agents.yalnizTesdiqlenmisReqemlerDoldurulmalidi")}
      >
        <AdminInput name="experienceYears" label={t("pages.agents.tecrubeIli")} type="number" min={0} max={80} defaultValue={initial.experienceYears} />
        <AdminInput name="soldCount" label={t("pages.agents.satisSayi")} type="number" min={0} defaultValue={initial.soldCount} />
        <AdminInput name="rentedCount" label={t("pages.agents.icareSayi")} type="number" min={0} defaultValue={initial.rentedCount} />
        <AdminInput
          name="responseMinutes"
          label={t("pages.agents.ortaCavabMuddetiDeqiqe")}
          type="number"
          min={1}
          max={10080}
          defaultValue={initial.responseMinutes}
          hint={t("pages.agents.prdBolme165Yalniz")}
        />
      </FormSection>

      <FormSection title={t("pages.agents.gorunurluk")} description={t("pages.agents.profilYalnizIctimaiKataloqda")}>
        <FullWidth>
          <div className="flex flex-wrap gap-5">
            <label className="flex min-h-11 items-center gap-2 text-sm text-ink">
              <input type="checkbox" name="isVerified" defaultChecked={initial.isVerified} className="size-4 accent-gold-deep" /> {t("pages.agents.tesdiqlenmisAgent")}
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm text-ink">
              <input type="checkbox" name="isPublic" defaultChecked={initial.isPublic} className="size-4 accent-gold-deep" /> {t("pages.agents.ictimaiKataloqdaGoster")}
            </label>
          </div>
        </FullWidth>
      </FormSection>
    </AdminForm>
  );
}
