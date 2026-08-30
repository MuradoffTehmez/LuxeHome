"use client";

import { Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { ButtonAnchor } from "@/components/ui/button";
import { StickyActionBar } from "@/components/ui/sticky-action-bar";
import { CompareButton } from "./compare-button";
import { FavoriteButton } from "./favorite-button";
import { PropertyQr } from "./property-qr";
import { ShareButtons } from "./share-buttons";
import { WhatsAppIcon } from "./brand-icons";
import { trackEvent } from "@/lib/client-analytics";

export type PropertyActionToolbarProps = {
  propertyId: string;
  path: string;
  title: string;
  phone: string;
  whatsappHref: string;
  /** Server tərəfdə çəkilmiş QR SVG-si — brauzerdə kitabxana yüklənmir. */
  qrSvg: string;
  slug: string;
};

/** Detalın secondary əməl və mobil conversion CTA-larını bir yerdə saxlayır. */
export function PropertyActionToolbar({
  propertyId,
  path,
  title,
  phone,
  whatsappHref,
  qrSvg,
  slug,
}: PropertyActionToolbarProps) {
  const t = useTranslations("content");
  const iconButtonClass =
    "bg-transparent text-ink hover:bg-beige focus-visible:outline-gold";

  return (
    <>
      <nav
        aria-label={t("propertyActions")}
        className="grid grid-cols-4 divide-x divide-line border-y border-line bg-paper sm:ml-auto sm:max-w-md"
      >
        <div className="flex min-h-14 items-center justify-center">
          <FavoriteButton propertyId={propertyId} className={iconButtonClass} />
        </div>
        <div className="flex min-h-14 items-center justify-center">
          <CompareButton propertyId={propertyId} className={iconButtonClass} />
        </div>
        <ShareButtons path={path} title={title} compact />
        <div className="flex min-h-14 items-center justify-center">
          <PropertyQr svg={qrSvg} slug={slug} />
        </div>
      </nav>

      <StickyActionBar className="grid grid-cols-2 gap-2">
        <ButtonAnchor href={phone} variant="outline" size="sm" fullWidth onClick={() => trackEvent("phone_click", { property_id: propertyId, placement: "sticky_toolbar" })}>
          <Phone className="size-4" aria-hidden="true" />
          {t("call")}
        </ButtonAnchor>
        <ButtonAnchor
          href={whatsappHref}
          variant="dark"
          size="sm"
          target="_blank"
          rel="noopener noreferrer"
          fullWidth
          onClick={() => trackEvent("whatsapp_click", { property_id: propertyId, placement: "sticky_toolbar" })}
        >
          <WhatsAppIcon className="size-4" />
          WhatsApp
        </ButtonAnchor>
      </StickyActionBar>
    </>
  );
}
