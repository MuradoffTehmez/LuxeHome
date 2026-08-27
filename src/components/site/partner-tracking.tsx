"use client";

import { Link } from "@/i18n/navigation";
import { trackEvent } from "@/lib/client-analytics";

export function PartnerProfileLink({
  partnerId,
  partnerType,
  placement,
  ...props
}: React.ComponentProps<typeof Link> & {
  partnerId: string;
  partnerType: string;
  placement: "home" | "partner_list";
}) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        props.onClick?.(event);
        trackEvent("partner_card_click", {
          partner_id: partnerId,
          partner_type: partnerType,
          placement,
        });
      }}
    />
  );
}

/** Tərəfdaş profilində əlaqəli elana keçidi ölçür; şəxsi məlumat göndərmir. */
export function PartnerListingTracker({
  partnerId,
  partnerType,
  propertyId,
  children,
}: {
  partnerId: string;
  partnerType: string;
  propertyId: string;
  children: React.ReactNode;
}) {
  return (
    <div
      onClickCapture={(event) => {
        if (!(event.target as HTMLElement).closest("a")) return;
        trackEvent("partner_listing_click", {
          partner_id: partnerId,
          partner_type: partnerType,
          property_id: propertyId,
          placement: "partner_detail",
        });
      }}
    >
      {children}
    </div>
  );
}
