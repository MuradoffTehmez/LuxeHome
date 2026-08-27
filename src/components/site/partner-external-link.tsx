"use client";

import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/client-analytics";

/**
 * Tərəfdaşın öz saytına keçid.
 *
 * Üç şey burada bir yerdə həll olunur ki, hər istifadə yerində unudulmasın:
 *
 * - `rel="noopener noreferrer"` — `target="_blank"` ilə açılan səhifə
 *   `window.opener` üzərindən bu sənədi manipulyasiya edə bilməməlidir.
 * - Kənar keçid ikonu — istifadəçi linkin saytdan çıxardığını əvvəlcədən görür.
 * - `partner_external_website_click` hadisəsi — tərəfdaşlığın nəticəsini ölçmək
 *   üçün lazımdır. Yalnız identifikator və növ göndərilir, şəxsi məlumat yox.
 */
export function PartnerExternalLink({
  href,
  partnerId,
  partnerType,
  placement,
  children,
  className,
  ariaLabel,
}: {
  href: string;
  partnerId: string;
  partnerType: string;
  /** Hansı səhifədən klikləndiyi — hesabatda mənbəni ayırmağa imkan verir. */
  placement: "home" | "partner_list" | "partner_detail" | "property_detail";
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      onClick={() =>
        trackEvent("partner_external_website_click", {
          partner_id: partnerId,
          partner_type: partnerType,
          placement,
        })
      }
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-xs transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
        className,
      )}
    >
      {children}
      <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
    </a>
  );
}
