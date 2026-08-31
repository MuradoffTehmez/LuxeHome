import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/config/site";
import { LOCALES, SEO_SETTING_KEYS } from "@/lib/constants";
import { parseJsonObject, type LocalSeoSettings, type SeoGlobalSettings } from "@/lib/serp";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminForm, FormSection } from "@/components/admin/form-shell";
import { AdminCheckbox, AdminInput, AdminSelect, AdminTextarea, FullWidth } from "@/components/admin/form-fields";
import { saveGlobalSeoSettings, saveLocalSeoSettings } from "../actions";

export const metadata: Metadata = { title: "SEO parametrləri" };
export const dynamic = "force-dynamic";

export default async function SeoSettingsPage() {
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
    latitude: null, longitude: null, phone: siteConfig.phone, email: siteConfig.email, openingHours: [], serviceAreas: ["Bakı"],
    googleMapsUrl: "", googleBusinessProfileUrl: "", socialProfiles: [siteConfig.instagramUrl],
  });
  const localeOptions = Object.values(LOCALES).map((value) => ({ value, label: value.toUpperCase() }));
  return <>
    <AdminPageHeader title="Qlobal və Local SEO parametrləri" description="Canonical host, metadata default-ları, index qapıları və vahid NAP məlumatı." breadcrumbs={[{ label: "SERP və SEO", href: "/admin/serp" }, { label: "Parametrlər" }]} />
    <div className="grid gap-6 xl:grid-cols-2">
      <AdminForm action={saveGlobalSeoSettings} submitLabel="Qlobal parametrləri saxla"><FormSection title="Qlobal SEO" description="Bütün public səhifələrin fallback siyasəti.">
        <AdminInput name="siteName" label="Sayt adı" defaultValue={global.siteName} required />
        <AdminInput name="titleTemplate" label="Title template" defaultValue={global.titleTemplate} required />
        <FullWidth><AdminTextarea name="defaultDescription" label="Standart meta təsvir" defaultValue={global.defaultDescription} rows={3} required /></FullWidth>
        <AdminInput name="canonicalHostname" label="Canonical host" defaultValue={global.canonicalHostname} required />
        <AdminInput name="defaultOgImage" label="Standart OG şəkli" defaultValue={global.defaultOgImage} required />
        <AdminSelect name="defaultLocale" label="Əsas dil" defaultValue={global.defaultLocale} options={localeOptions} />
        <AdminSelect name="xDefaultLocale" label="x-default dili" defaultValue={global.xDefaultLocale} options={localeOptions} />
        <AdminInput name="minLandingInventory" label="Minimum landing inventarı" type="number" min={1} max={100} defaultValue={global.minLandingInventory} />
        <AdminInput name="minPropertyImages" label="Minimum elan şəkli" type="number" min={1} max={20} defaultValue={global.minPropertyImages} />
        <AdminInput name="expiredRetentionDays" label="Keçmiş elan retention (gün)" type="number" min={1} max={3650} defaultValue={global.expiredRetentionDays} />
        <AdminCheckbox name="defaultRobotsIndex" label="Standart index" defaultChecked={global.defaultRobotsIndex} />
        <AdminCheckbox name="defaultRobotsFollow" label="Standart follow" defaultChecked={global.defaultRobotsFollow} />
        <AdminCheckbox name="indexEmptyCategories" label="Boş kateqoriyanı indekslə" defaultChecked={global.indexEmptyCategories} />
      </FormSection></AdminForm>
      <AdminForm action={saveLocalSeoSettings} submitLabel="Local SEO məlumatını saxla"><FormSection title="Local SEO / NAP" description="Sayt, schema, GBP və sitatlarda eyni saxlanmalı məlumat.">
        <AdminInput name="businessName" label="Biznes adı" defaultValue={local.businessName} required />
        <AdminInput name="legalName" label="Hüquqi ad" defaultValue={local.legalName} required />
        <FullWidth><AdminTextarea name="address" label="Tam ünvan" defaultValue={local.address} rows={2} required /></FullWidth>
        <AdminInput name="latitude" label="Enlik" type="number" step="any" defaultValue={local.latitude ?? ""} />
        <AdminInput name="longitude" label="Uzunluq" type="number" step="any" defaultValue={local.longitude ?? ""} />
        <AdminInput name="phone" label="Telefon" defaultValue={local.phone} required />
        <AdminInput name="email" label="E-poçt" type="email" defaultValue={local.email} required />
        <FullWidth><AdminTextarea name="openingHours" label="İş saatları (sətir-sətir)" defaultValue={local.openingHours.join("\n")} rows={4} /></FullWidth>
        <FullWidth><AdminTextarea name="serviceAreas" label="Xidmət bölgələri" defaultValue={local.serviceAreas.join("\n")} rows={4} /></FullWidth>
        <AdminInput name="googleMapsUrl" label="Google Maps URL" defaultValue={local.googleMapsUrl} />
        <AdminInput name="googleBusinessProfileUrl" label="Google Business Profile URL" defaultValue={local.googleBusinessProfileUrl} />
        <FullWidth><AdminTextarea name="socialProfiles" label="Rəsmi sosial profillər" defaultValue={local.socialProfiles.join("\n")} rows={4} /></FullWidth>
      </FormSection></AdminForm>
    </div>
  </>;
}

