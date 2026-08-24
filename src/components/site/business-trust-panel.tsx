"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Building2, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { siteConfig } from "@/config/site";
import { isUnoptimizedImage } from "@/lib/utils";

export function BusinessTrustPanel({ imageUrl, imageAlt }: { imageUrl?: string | null; imageAlt?: string }) {
  const t = useTranslations("content.trust");
  return (
    <aside aria-label={t("aria")} className="overflow-hidden rounded-md border border-line bg-paper">
      {imageUrl && (
        <div className="relative aspect-16/9">
          <Image src={imageUrl} alt={imageAlt || t("officeAlt", { brand: siteConfig.name })} fill unoptimized={isUnoptimizedImage(imageUrl)} sizes="(max-width: 1024px) 100vw, 42vw" className="object-cover" />
        </div>
      )}
      <div className="p-5 sm:p-6">
        <p className="editorial-kicker text-gold-deep">{t("verified")}</p>
        <h2 className="mt-2 font-display text-2xl text-ink">{siteConfig.legalName}</h2>
        <dl className="mt-5 grid gap-4 text-sm text-ink-soft">
          <div className="flex gap-3"><Building2 className="mt-0.5 size-4 shrink-0 text-gold-deep" aria-hidden="true" /><div><dt className="font-medium text-ink">{t("taxId")}</dt><dd className="tabular">{siteConfig.legal.voen}</dd></div></div>
          <div className="flex gap-3"><UserRound className="mt-0.5 size-4 shrink-0 text-gold-deep" aria-hidden="true" /><div><dt className="font-medium text-ink">{t("owner")}</dt><dd>{siteConfig.owner.name}</dd></div></div>
          <div className="flex gap-3"><MapPin className="mt-0.5 size-4 shrink-0 text-gold-deep" aria-hidden="true" /><div><dt className="font-medium text-ink">{t("address")}</dt><dd>{siteConfig.addressFull}</dd></div></div>
          <div className="flex gap-3"><Phone className="mt-0.5 size-4 shrink-0 text-gold-deep" aria-hidden="true" /><div><dt className="font-medium text-ink">{t("phone")}</dt><dd><a href={siteConfig.phoneHref} className="hover:text-gold-deep">{siteConfig.phone}</a></dd></div></div>
          <div className="flex gap-3"><Mail className="mt-0.5 size-4 shrink-0 text-gold-deep" aria-hidden="true" /><div><dt className="font-medium text-ink">{t("email")}</dt><dd><a href={`mailto:${siteConfig.email}`} className="hover:text-gold-deep">{siteConfig.email}</a></dd></div></div>
        </dl>
      </div>
    </aside>
  );
}
