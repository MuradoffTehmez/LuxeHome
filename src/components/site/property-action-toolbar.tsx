"use client";

import { Phone } from "lucide-react";
import { ButtonAnchor } from "@/components/ui/button";
import { StickyActionBar } from "@/components/ui/sticky-action-bar";
import { CompareButton } from "./compare-button";
import { FavoriteButton } from "./favorite-button";
import { ShareButtons } from "./share-buttons";
import { WhatsAppIcon } from "./brand-icons";

export type PropertyActionToolbarProps = {
  propertyId: string;
  path: string;
  title: string;
  phone: string;
  whatsappHref: string;
};

/** Detalın secondary əməl və mobil conversion CTA-larını bir yerdə saxlayır. */
export function PropertyActionToolbar({
  propertyId,
  path,
  title,
  phone,
  whatsappHref,
}: PropertyActionToolbarProps) {
  const iconButtonClass =
    "bg-transparent text-ink hover:bg-beige focus-visible:outline-gold";

  return (
    <>
      <nav
        aria-label="Əmlak əməliyyatları"
        className="grid grid-cols-3 divide-x divide-line border-y border-line bg-paper sm:ml-auto sm:max-w-sm"
      >
        <div className="flex min-h-14 items-center justify-center">
          <FavoriteButton propertyId={propertyId} className={iconButtonClass} />
        </div>
        <div className="flex min-h-14 items-center justify-center">
          <CompareButton propertyId={propertyId} className={iconButtonClass} />
        </div>
        <ShareButtons path={path} title={title} compact />
      </nav>

      <StickyActionBar className="grid grid-cols-2 gap-2">
        <ButtonAnchor href={phone} variant="outline" size="sm" fullWidth>
          <Phone className="size-4" aria-hidden="true" />
          Zəng et
        </ButtonAnchor>
        <ButtonAnchor
          href={whatsappHref}
          variant="dark"
          size="sm"
          target="_blank"
          rel="noopener noreferrer"
          fullWidth
        >
          <WhatsAppIcon className="size-4" />
          WhatsApp
        </ButtonAnchor>
      </StickyActionBar>
    </>
  );
}
