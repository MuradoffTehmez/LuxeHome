import { getAdminT } from "@/lib/admin-i18n";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/config/site";
import { LOCALES, SEO_SETTING_KEYS } from "@/lib/constants";
import { parseJsonObject, type LocalSeoSettings, type SeoGlobalSettings } from "@/lib/serp";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminForm, FormSection } from "@/components/admin/form-shell";
import { AdminCheckbox, AdminInput, AdminSelect, AdminTextarea, FullWidth } from "@/components/admin/form-fields";
import { saveGlobalSeoSettings, saveLocalSeoSettings } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.serp.seoParametrleri") };
}
export const dynamic = "force-dynamic";

export default async function SeoSettingsPage() {
  const t = await getAdminT();
  const rows = await prisma.setting.findMany({ where: { key: { in: [SEO_SETTING_KEYS.GLOBAL, SEO_SETTING_KEYS.LOCAL] } } });
  const byKey = new Map(rows.map((row) => [row.key, row.value]));
  const global = parseJsonObject<SeoGlobalSettings>(byKey.get(SEO_SETTING_KEYS.GLOBAL), {
    siteName: siteConfig.name, titleTemplate: "%s | LuxeHomeEstate", defaultDescription: siteConfig.description,
    canonicalHostname: "luxehomeestate.az", defaultLocale: "az", xDefaultLocale: "az", defaultOgImage: "/og-default.png",
    defaultRobotsIndex: true, defaultRobotsFollow: true, minLandingInventory: 5, indexEmptyCategories: false,
    minPropertyImages: 1, expiredRetentionDays: 180,
  });
  const local = parseJsonObject<LocalSeoSettings>(byKey.get(SEO_SETTING_KEYS.LOCAL), {
    businessName: siteConfig.name, legalName: siteConfig.legalName, address: siteConfig.addressFull,
    latitude: null, longitude: null, phone: siteConfig.phone, email: siteConfig.email, openingHours: [], serviceAreas: [t("pages.misc.baki")],
    googleMapsUrl: "", googleBusinessProfileUrl: "", socialProfiles: [siteConfig.instagramUrl],
  });
  const localeOptions = Object.values(LOCALES).map((value) => ({ value, label: value.toUpperCase() }));
  return <>
    <AdminPageHeader title={t("pages.serp.qlobalVeLocalSeo")} description={t("pages.serp.canonicalHostMetadataDefault")} breadcrumbs={[{ label: t("pages.serp.serpVeSeo"), href: "/admin/serp" }, { label: t("pages.serp.parametrler") }]} />
    <div className="grid gap-6 xl:grid-cols-2">
      <AdminForm action={saveGlobalSeoSettings} submitLabel={t("pages.serp.qlobalParametrleriSaxla")}><FormSection title={t("pages.serp.qlobalSeo")} description={t("pages.serp.butunPublicSehifelerinFallback")}>
        <AdminInput name="siteName" label={t("pages.serp.saytAdi")} defaultValue={global.siteName} required />
        <AdminInput name="titleTemplate" label={t("pages.serp.titleTemplate")} defaultValue={global.titleTemplate} required />
        <FullWidth><AdminTextarea name="defaultDescription" label={t("pages.serp.standartMetaTesvir")} defaultValue={global.defaultDescription} rows={3} required /></FullWidth>
        <AdminInput name="canonicalHostname" label={t("pages.serp.canonicalHost")} defaultValue={global.canonicalHostname} required />
        <AdminInput name="defaultOgImage" label={t("pages.serp.standartOgSekli")} defaultValue={global.defaultOgImage} required />
        <AdminSelect name="defaultLocale" label={t("pages.serp.esasDil")} defaultValue={global.defaultLocale} options={localeOptions} />
        <AdminSelect name="xDefaultLocale" label={t("pages.serp.xDefaultDili")} defaultValue={global.xDefaultLocale} options={localeOptions} />
        <AdminInput name="minLandingInventory" label={t("pages.serp.minimumLandingInventari")} type="number" min={1} max={100} defaultValue={global.minLandingInventory} />
        <AdminInput name="minPropertyImages" label={t("pages.serp.minimumElanSekli")} type="number" min={1} max={20} defaultValue={global.minPropertyImages} />
        <AdminInput name="expiredRetentionDays" label={t("pages.serp.kecmisElanRetentionGun")} type="number" min={1} max={3650} defaultValue={global.expiredRetentionDays} />
        <AdminCheckbox name="defaultRobotsIndex" label={t("pages.serp.standartIndex")} defaultChecked={global.defaultRobotsIndex} />
        <AdminCheckbox name="defaultRobotsFollow" label={t("pages.serp.standartFollow")} defaultChecked={global.defaultRobotsFollow} />
        <AdminCheckbox name="indexEmptyCategories" label={t("pages.serp.bosKateqoriyaniIndeksle")} defaultChecked={global.indexEmptyCategories} />
      </FormSection></AdminForm>
      <AdminForm action={saveLocalSeoSettings} submitLabel={t("pages.serp.localSeoMelumatiniSaxla")}><FormSection title={t("pages.serp.localSeoNap")} description={t("pages.serp.saytSchemaGbpVe")}>
        <AdminInput name="businessName" label={t("pages.serp.biznesAdi")} defaultValue={local.businessName} required />
        <AdminInput name="legalName" label={t("pages.serp.huquqiAd")} defaultValue={local.legalName} required />
        <FullWidth><AdminTextarea name="address" label={t("pages.serp.tamUnvan")} defaultValue={local.address} rows={2} required /></FullWidth>
        <AdminInput name="latitude" label={t("pages.serp.enlik")} type="number" step="any" defaultValue={local.latitude ?? ""} />
        <AdminInput name="longitude" label={t("pages.serp.uzunluq")} type="number" step="any" defaultValue={local.longitude ?? ""} />
        <AdminInput name="phone" label={t("pages.serp.telefon")} defaultValue={local.phone} required />
        <AdminInput name="email" label={t("pages.serp.ePoct")} type="email" defaultValue={local.email} required />
        <FullWidth><AdminTextarea name="openingHours" label={t("pages.serp.isSaatlariSetirSetir")} defaultValue={local.openingHours.join("\n")} rows={4} /></FullWidth>
        <FullWidth><AdminTextarea name="serviceAreas" label={t("pages.serp.xidmetBolgeleri")} defaultValue={local.serviceAreas.join("\n")} rows={4} /></FullWidth>
        <AdminInput name="googleMapsUrl" label={t("pages.serp.googleMapsUrl")} defaultValue={local.googleMapsUrl} />
        <AdminInput name="googleBusinessProfileUrl" label={t("pages.serp.googleBusinessProfileUrl")} defaultValue={local.googleBusinessProfileUrl} />
        <FullWidth><AdminTextarea name="socialProfiles" label={t("pages.serp.resmiSosialProfiller")} defaultValue={local.socialProfiles.join("\n")} rows={4} /></FullWidth>
      </FormSection></AdminForm>
    </div>
  </>;
}

