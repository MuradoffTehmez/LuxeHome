"use client";

import { AdminForm, FormSection } from "@/components/admin/form-shell";
import {
  AdminCheckbox,
  AdminInput,
  AdminSelect,
  AdminTextarea,
  FullWidth,
} from "@/components/admin/form-fields";
import { ContentEditor } from "@/components/admin/content-editor";
import { ImageDropzone } from "@/components/admin/image-dropzone";
import { SeoFields } from "@/components/admin/seo-fields";
import {
  KNOWLEDGE_AUDIENCES,
  KNOWLEDGE_LEVELS,
  KNOWLEDGE_RISK_LEVELS,
  KNOWLEDGE_STATUSES,
  LEGAL_CONTENT_STATUSES,
} from "@/lib/constants";
import type { ActionState } from "@/lib/admin/action-state";
import type { KnowledgeArticleFormValues } from "./form-values";
import { useTranslations } from "next-intl";

export function KnowledgeArticleForm({
  action,
  initial,
  categories,
  submitLabel,
  extraActions,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  initial: KnowledgeArticleFormValues;
  categories: { id: string; name: string }[];
  submitLabel: string;
  extraActions?: React.ReactNode;
}) {
  const t = useTranslations("admin");
  return (
    <AdminForm
      action={action}
      submitLabel={submitLabel}
      cancelHref="/admin/bilik-merkezi"
      extraActions={extraActions}
    >
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <FormSection
        title={t("pages.knowledge.beledci")}
        description={t("pages.knowledge.mezmunAzerbaycanRespublikasininQanunveri")}
      >
        <FullWidth>
          <AdminInput
            name="title"
            label={t("pages.knowledge.basliq")}
            required
            defaultValue={initial.title}
            maxLength={180}
          />
        </FullWidth>

        <AdminInput
          name="slug"
          label={t("pages.knowledge.slug")}
          defaultValue={initial.slug}
          maxLength={90}
          hint={t("pages.knowledge.bosBuraxsanizBasliqdanAvtomatik")}
        />

        <AdminSelect
          name="status"
          label={t("pages.knowledge.status")}
          required
          defaultValue={initial.status}
          options={Object.values(KNOWLEDGE_STATUSES).map((value) => ({
            value,
            label: t(`labels.knowledgeStatus.${value}`),
          }))}
        />

        <AdminSelect
          name="categoryId"
          label={t("pages.knowledge.movzu")}
          defaultValue={initial.categoryId}
          placeholder={t("pages.knowledge.movzusuz")}
          options={categories.map((category) => ({ value: category.id, label: category.name }))}
        />

        <AdminSelect
          name="audience"
          label={t("pages.knowledge.kimeUnvanlanib")}
          required
          defaultValue={initial.audience}
          options={Object.values(KNOWLEDGE_AUDIENCES).map((value) => ({
            value,
            label: t(`labels.knowledgeAudience.${value}`),
          }))}
        />

        <AdminSelect
          name="level"
          label={t("pages.knowledge.seviyye")}
          required
          defaultValue={initial.level}
          options={Object.values(KNOWLEDGE_LEVELS).map((value) => ({
            value,
            label: t(`labels.knowledgeLevel.${value}`),
          }))}
        />

        <FullWidth>
          <AdminTextarea
            name="excerpt"
            label={t("pages.knowledge.qisaTesvir")}
            required
            rows={3}
            maxLength={400}
            defaultValue={initial.excerpt}
            hint={t("pages.knowledge.kartlardaAxtarisNeticelerindeVe")}
          />
        </FullWidth>

        <FullWidth>
          <ContentEditor name="content" label={t("pages.knowledge.metn")} defaultValue={initial.content} />
        </FullWidth>

        <FullWidth>
          <AdminCheckbox
            name="isFeatured"
            label={t("pages.knowledge.bilikMerkezininGirisindeOne")}
            defaultChecked={initial.isFeatured}
          />
        </FullWidth>
      </FormSection>

      <FormSection
        title={t("pages.knowledge.huquqiStatus")}
        description={t("pages.knowledge.quvvedeOlanNormaniTeklifden")}
      >
        <AdminSelect name="legalStatus" label={t("pages.knowledge.normaninStatusu")} required defaultValue={initial.legalStatus} options={Object.values(LEGAL_CONTENT_STATUSES).map((value) => ({ value, label: t(`labels.legalContentStatus.${value}`) }))} />
        <AdminSelect name="riskLevel" label={t("pages.knowledge.riskSiqnali")} required defaultValue={initial.riskLevel} options={Object.values(KNOWLEDGE_RISK_LEVELS).map((value) => ({ value, label: t(`labels.knowledgeRiskLevel.${value}`) }))} />
        <AdminInput name="jurisdiction" label={t("pages.knowledge.yurisdiksiya")} required maxLength={120} defaultValue={initial.jurisdiction} />
        <AdminInput name="legalReviewedAt" label={t("pages.knowledge.sonHuquqiYoxlama")} type="date" defaultValue={initial.legalReviewedAt} />
        <FullWidth><AdminTextarea name="legalActs" label={t("pages.knowledge.esasHuquqiAktlar")} rows={5} defaultValue={initial.legalActs} hint={t("pages.knowledge.herSetirdeBirQanun")} /></FullWidth>
        <FullWidth><AdminTextarea name="sourceUrls" label={t("pages.knowledge.prioritetResmiMenbeler")} rows={5} defaultValue={initial.sourceUrls} hint={t("pages.knowledge.herSetirdeBirTam")} /></FullWidth>
      </FormSection>

      <FormSection
        title={t("pages.knowledge.strukturlasdirilmisHuquqiBloklar")}
        description={t("pages.knowledge.senedlerProsedurXercVe")}
      >
        <FullWidth><ContentEditor name="legalBasis" label={t("pages.knowledge.huquqiEsas")} defaultValue={initial.legalBasis} /></FullWidth>
        <FullWidth><ContentEditor name="requiredDocuments" label={t("pages.knowledge.telebOlunanSenedler")} defaultValue={initial.requiredDocuments} /></FullWidth>
        <FullWidth><ContentEditor name="procedure" label={t("pages.knowledge.prosedur")} defaultValue={initial.procedure} /></FullWidth>
        <FullWidth><ContentEditor name="duration" label={t("pages.knowledge.vaxtMuddetler")} defaultValue={initial.duration} /></FullWidth>
        <FullWidth><ContentEditor name="costs" label={t("pages.knowledge.vergiRusumVeXercler")} defaultValue={initial.costs} /></FullWidth>
        <FullWidth><ContentEditor name="risks" label={t("pages.knowledge.risklerVeRedFlags")} defaultValue={initial.risks} /></FullWidth>
        <FullWidth><ContentEditor name="checklist" label={t("pages.knowledge.checkList")} defaultValue={initial.checklist} /></FullWidth>
        <FullWidth><ContentEditor name="template" label={t("pages.knowledge.sablonNumune")} defaultValue={initial.template} /></FullWidth>
        <FullWidth><ContentEditor name="courtPosition" label={t("pages.knowledge.mehkemeMovqeyi")} defaultValue={initial.courtPosition} /></FullWidth>
      </FormSection>

      <FormSection title={t("pages.knowledge.uzQabigi")}>
        <FullWidth>
          <ImageDropzone
            name="cover"
            label={t("pages.knowledge.uzQabigiSekli")}
            folder="bilik-merkezi"
            mode="single"
            initial={initial.cover}
            hint={t("pages.knowledge.ixtiyaridirSekilOlmadiqdaKart")}
          />
        </FullWidth>
      </FormSection>

      <FormSection title="SEO" description={t("pages.knowledge.bosBuraxilsaBasliqVe")}>
        <SeoFields
          initialTitle={initial.metaTitle}
          initialDescription={initial.metaDescription}
          fallbackTitle={initial.title || t("pages.misc.bilikMerkeziBeledcisi")}
          fallbackDescription={initial.excerpt || t("pages.misc.beledcininQisaTesviri")}
          pathname={`/bilik-merkezi/${initial.slug || "yeni-beledci"}`}
        />
        <AdminInput
          name="canonicalUrl"
          label={t("pages.knowledge.canonicalUrl")}
          defaultValue={initial.canonicalUrl}
          placeholder={t("pages.knowledge.bosBuraxilsaOzUnvanina")}
        />
        <FullWidth>
          <AdminCheckbox
            name="noIndex"
            label={t("pages.knowledge.axtarisMotorlarindaGizletNoindex")}
            defaultChecked={initial.noIndex}
          />
        </FullWidth>
      </FormSection>

      <FormSection
        title={t("pages.knowledge.openGraph")}
        description={t("pages.knowledge.sosialSebekedePaylasilandaGorunen")}
      >
        <AdminInput name="ogTitle" label={t("pages.knowledge.ogBasliq")} defaultValue={initial.ogTitle} maxLength={70} />
        <AdminInput
          name="ogDescription"
          label={t("pages.knowledge.ogTesvir")}
          defaultValue={initial.ogDescription}
          maxLength={200}
        />
        <AdminInput
          name="ogImage"
          label={t("pages.knowledge.ogSekilUrl")}
          defaultValue={initial.ogImage}
          placeholder={t("pages.knowledge.bosBuraxilsaUzQabigi")}
        />
      </FormSection>
    </AdminForm>
  );
}
