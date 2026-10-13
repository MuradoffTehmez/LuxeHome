"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button, ButtonAnchor } from "@/components/ui/button";
import { StickyActionBar } from "@/components/ui/sticky-action-bar";
import { CompareButton } from "./compare-button";
import { FavoriteButton } from "./favorite-button";
import { PropertyQr } from "./property-qr";
import { ShareButtons } from "./share-buttons";
import { WhatsAppIcon } from "./brand-icons";
import { trackEvent } from "@/lib/client-analytics";
import { phoneHref, publisherWhatsappHref } from "@/lib/accounts/listing-publisher";
import { revealPublisherContact } from "./publisher-contact";

/** İctimai hesabın elanı: nömrə HTML-də yoxdur, düymə kliklə onu API-dən alır. */
export type ToolbarReveal = {
  hasPhone: boolean;
  hasWhatsapp: boolean;
  whatsappMessage: string;
};

export type PropertyActionToolbarProps = {
  propertyId: string;
  path: string;
  title: string;
  /** Şirkət elanının `tel:` linki. `reveal` verilibsə nəzərə alınmır. */
  phone: string | null;
  /** Şirkət elanının WhatsApp linki. */
  whatsappHref: string | null;
  /** İctimai hesabın elanı — əlaqə kliklə açılır. */
  reveal?: ToolbarReveal | null;
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
  reveal = null,
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
        className="grid grid-cols-4 divide-x divide-line overflow-hidden rounded-full border border-line bg-paper shadow-xs sm:ml-auto sm:max-w-md"
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

      {reveal ? (
        <RevealStickyBar propertyId={propertyId} reveal={reveal} />
      ) : (
        <StickyActionBar className={phone && whatsappHref ? "grid grid-cols-2 gap-2" : "grid grid-cols-1 gap-2"}>
          {phone && (
            <ButtonAnchor href={phone} variant="outline" size="sm" fullWidth onClick={() => trackEvent("phone_click", { property_id: propertyId, placement: "sticky_toolbar" })}>
              <Phone className="size-4" aria-hidden="true" />
              {t("call")}
            </ButtonAnchor>
          )}
          {whatsappHref && (
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
          )}
        </StickyActionBar>
      )}
    </>
  );
}

/**
 * Mobil zolaq — elan sahibinin nömrəsi kliklə alınır, sonra zəng/WhatsApp açılır.
 * Nömrə yoxdursa zolaq göstərilmir: e-poçt və forma sağ blokda qalır.
 */
function RevealStickyBar({ propertyId, reveal }: { propertyId: string; reveal: ToolbarReveal }) {
  const t = useTranslations("content");
  const [loading, setLoading] = useState<"call" | "whatsapp" | null>(null);
  if (!reveal.hasPhone) return null;

  async function open(kind: "call" | "whatsapp") {
    setLoading(kind);
    const contact = await revealPublisherContact(propertyId);
    setLoading(null);
    if (!contact?.phone) return;
    trackEvent(kind === "call" ? "phone_click" : "whatsapp_click", { property_id: propertyId, placement: "sticky_toolbar" });
    const href = kind === "call" ? phoneHref(contact.phone) : publisherWhatsappHref(contact.phone, reveal.whatsappMessage);
    if (href) window.location.href = href;
  }

  return (
    <StickyActionBar className={reveal.hasWhatsapp ? "grid grid-cols-2 gap-2" : "grid grid-cols-1 gap-2"}>
      <Button type="button" variant="outline" size="sm" fullWidth loading={loading === "call"} onClick={() => open("call")}>
        <Phone className="size-4" aria-hidden="true" />
        {t("call")}
      </Button>
      {reveal.hasWhatsapp && (
        <Button type="button" variant="dark" size="sm" fullWidth loading={loading === "whatsapp"} onClick={() => open("whatsapp")}>
          <WhatsAppIcon className="size-4" />
          WhatsApp
        </Button>
      )}
    </StickyActionBar>
  );
}
