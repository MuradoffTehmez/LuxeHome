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
  KNOWLEDGE_AUDIENCE_LABELS,
  KNOWLEDGE_AUDIENCES,
  KNOWLEDGE_LEVEL_LABELS,
  KNOWLEDGE_LEVELS,
  KNOWLEDGE_RISK_LEVEL_LABELS,
  KNOWLEDGE_RISK_LEVELS,
  KNOWLEDGE_STATUS_LABELS,
  KNOWLEDGE_STATUSES,
  LEGAL_CONTENT_STATUS_LABELS,
  LEGAL_CONTENT_STATUSES,
} from "@/lib/constants";
import type { ActionState } from "@/lib/admin/action-state";
import type { KnowledgeArticleFormValues } from "./form-values";

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
  return (
    <AdminForm
      action={action}
      submitLabel={submitLabel}
      cancelHref="/admin/bilik-merkezi"
      extraActions={extraActions}
    >
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <FormSection
        title="Bələdçi"
        description="Məzmun Azərbaycan Respublikasının qanunvericiliyinə istinad etməlidir; konkret rəqəm və dərəcələr dəyişə bildiyi üçün rəsmi mənbəyə keçid verilməlidir."
      >
        <FullWidth>
          <AdminInput
            name="title"
            label="Başlıq"
            required
            defaultValue={initial.title}
            maxLength={180}
          />
        </FullWidth>

        <AdminInput
          name="slug"
          label="Slug"
          defaultValue={initial.slug}
          maxLength={90}
          hint="Boş buraxsanız başlıqdan avtomatik yaradılır."
        />

        <AdminSelect
          name="status"
          label="Status"
          required
          defaultValue={initial.status}
          options={Object.values(KNOWLEDGE_STATUSES).map((value) => ({
            value,
            label: KNOWLEDGE_STATUS_LABELS[value],
          }))}
        />

        <AdminSelect
          name="categoryId"
          label="Mövzu"
          defaultValue={initial.categoryId}
          placeholder="Mövzusuz"
          options={categories.map((category) => ({ value: category.id, label: category.name }))}
        />

        <AdminSelect
          name="audience"
          label="Kimə ünvanlanıb"
          required
          defaultValue={initial.audience}
          options={Object.values(KNOWLEDGE_AUDIENCES).map((value) => ({
            value,
            label: KNOWLEDGE_AUDIENCE_LABELS[value],
          }))}
        />

        <AdminSelect
          name="level"
          label="Səviyyə"
          required
          defaultValue={initial.level}
          options={Object.values(KNOWLEDGE_LEVELS).map((value) => ({
            value,
            label: KNOWLEDGE_LEVEL_LABELS[value],
          }))}
        />

        <FullWidth>
          <AdminTextarea
            name="excerpt"
            label="Qısa təsvir"
            required
            rows={3}
            maxLength={400}
            defaultValue={initial.excerpt}
            hint="Kartlarda, axtarış nəticələrində və paylaşım kartında görünür."
          />
        </FullWidth>

        <FullWidth>
          <ContentEditor name="content" label="Mətn" defaultValue={initial.content} />
        </FullWidth>

        <FullWidth>
          <AdminCheckbox
            name="isFeatured"
            label="Bilik Mərkəzinin girişində önə çıxar"
            defaultChecked={initial.isFeatured}
          />
        </FullWidth>
      </FormSection>

      <FormSection
        title="Hüquqi status"
        description="Qüvvədə olan normanı təklifdən ayırın və hüquqşünas yoxlamasının tarixini göstərin."
      >
        <AdminSelect name="legalStatus" label="Normanın statusu" required defaultValue={initial.legalStatus} options={Object.values(LEGAL_CONTENT_STATUSES).map((value) => ({ value, label: LEGAL_CONTENT_STATUS_LABELS[value] }))} />
        <AdminSelect name="riskLevel" label="Risk siqnalı" required defaultValue={initial.riskLevel} options={Object.values(KNOWLEDGE_RISK_LEVELS).map((value) => ({ value, label: KNOWLEDGE_RISK_LEVEL_LABELS[value] }))} />
        <AdminInput name="jurisdiction" label="Yurisdiksiya" required maxLength={120} defaultValue={initial.jurisdiction} />
        <AdminInput name="legalReviewedAt" label="Son hüquqi yoxlama" type="date" defaultValue={initial.legalReviewedAt} />
        <FullWidth><AdminTextarea name="legalActs" label="Əsas hüquqi aktlar" rows={5} defaultValue={initial.legalActs} hint="Hər sətirdə bir qanun, məcəllə və ya məhkəmə qərarı." /></FullWidth>
        <FullWidth><AdminTextarea name="sourceUrls" label="Prioritet rəsmi mənbələr" rows={5} defaultValue={initial.sourceUrls} hint="Hər sətirdə bir tam https:// URL. Xəbər və kommersiya mənbəyini rəsmi norma kimi göstərməyin." /></FullWidth>
      </FormSection>

      <FormSection
        title="Strukturlaşdırılmış hüquqi bloklar"
        description="Sənədlər, prosedur, xərc və risklər ayrıca saxlanılır; bu bloklar bələdçinin əvvəlində göstərilir."
      >
        <FullWidth><ContentEditor name="legalBasis" label="Hüquqi əsas" defaultValue={initial.legalBasis} /></FullWidth>
        <FullWidth><ContentEditor name="requiredDocuments" label="Tələb olunan sənədlər" defaultValue={initial.requiredDocuments} /></FullWidth>
        <FullWidth><ContentEditor name="procedure" label="Prosedur" defaultValue={initial.procedure} /></FullWidth>
        <FullWidth><ContentEditor name="duration" label="Vaxt / müddətlər" defaultValue={initial.duration} /></FullWidth>
        <FullWidth><ContentEditor name="costs" label="Vergi, rüsum və xərclər" defaultValue={initial.costs} /></FullWidth>
        <FullWidth><ContentEditor name="risks" label="Risklər və red flags" defaultValue={initial.risks} /></FullWidth>
        <FullWidth><ContentEditor name="checklist" label="Check-list" defaultValue={initial.checklist} /></FullWidth>
        <FullWidth><ContentEditor name="template" label="Şablon / nümunə" defaultValue={initial.template} /></FullWidth>
        <FullWidth><ContentEditor name="courtPosition" label="Məhkəmə mövqeyi" defaultValue={initial.courtPosition} /></FullWidth>
      </FormSection>

      <FormSection title="Üz qabığı">
        <FullWidth>
          <ImageDropzone
            name="cover"
            label="Üz qabığı şəkli"
            folder="bilik-merkezi"
            mode="single"
            initial={initial.cover}
            hint="İxtiyaridir. Şəkil olmadıqda kart ikon ilə göstərilir."
          />
        </FullWidth>
      </FormSection>

      <FormSection title="SEO" description="Boş buraxılsa, başlıq və qısa təsvirdən qurulur.">
        <SeoFields
          initialTitle={initial.metaTitle}
          initialDescription={initial.metaDescription}
          fallbackTitle={initial.title || "Bilik Mərkəzi bələdçisi"}
          fallbackDescription={initial.excerpt || "Bələdçinin qısa təsviri"}
          pathname={`/bilik-merkezi/${initial.slug || "yeni-beledci"}`}
        />
        <AdminInput
          name="canonicalUrl"
          label="Canonical URL"
          defaultValue={initial.canonicalUrl}
          placeholder="Boş buraxılsa öz ünvanına işarə edir"
        />
        <FullWidth>
          <AdminCheckbox
            name="noIndex"
            label="Axtarış motorlarında gizlət (noindex)"
            defaultChecked={initial.noIndex}
          />
        </FullWidth>
      </FormSection>

      <FormSection
        title="Open Graph"
        description="Sosial şəbəkədə paylaşılanda görünən başlıq/təsvir/şəkil. Boş buraxılsa meta sahələr istifadə olunur."
      >
        <AdminInput name="ogTitle" label="OG başlıq" defaultValue={initial.ogTitle} maxLength={70} />
        <AdminInput
          name="ogDescription"
          label="OG təsvir"
          defaultValue={initial.ogDescription}
          maxLength={200}
        />
        <AdminInput
          name="ogImage"
          label="OG şəkil URL"
          defaultValue={initial.ogImage}
          placeholder="Boş buraxılsa üz qabığı şəkli istifadə olunur"
        />
      </FormSection>
    </AdminForm>
  );
}
