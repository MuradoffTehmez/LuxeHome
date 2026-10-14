"use client";

import { useState } from "react";
import { Eye, Mail, Phone } from "lucide-react";
import { Button, ButtonAnchor } from "@/components/ui/button";
import { WhatsAppIcon } from "./brand-icons";
import { trackEvent } from "@/lib/client-analytics";
import { phoneHref, publisherWhatsappHref } from "@/lib/accounts/listing-publisher";

/** `whatsapp` yalnız agentlik profilində ayrıca nömrə ola bilər; yoxdursa telefon işlədilir. */
export type RevealedContact = { phone: string | null; email: string | null; whatsapp?: string | null };

/**
 * Bir səhifədə sağ blok və mobil zolaq eyni əlaqəni istəyir — sorğu bir dəfə gedir.
 * Uğursuz cavab keşdə saxlanılmır ki, istifadəçi yenidən cəhd edə bilsin.
 */
const pending = new Map<string, Promise<RevealedContact | null>>();

/** Əlaqəni ünvandan alır: elan (`/api/emlaklar/<id>/elaqe`) və ya agentlik (`/api/agentlikler/<slug>/elaqe`). */
export function revealContact(endpoint: string): Promise<RevealedContact | null> {
  const existing = pending.get(endpoint);
  if (existing) return existing;
  const request = fetch(endpoint, { method: "POST" })
    .then(async (response) => (response.ok ? ((await response.json()) as RevealedContact) : null))
    .catch(() => null)
    .then((contact) => {
      if (!contact) pending.delete(endpoint);
      return contact;
    });
  pending.set(endpoint, request);
  return request;
}

export function propertyContactEndpoint(propertyId: string): string {
  return `/api/emlaklar/${encodeURIComponent(propertyId)}/elaqe`;
}

export function revealPublisherContact(propertyId: string): Promise<RevealedContact | null> {
  return revealContact(propertyContactEndpoint(propertyId));
}

export type PublisherContactLabels = {
  showPhone: string;
  showEmail: string;
  revealError: string;
  noPhone: string;
};

/**
 * Elan sahibinin əlaqə düymələri. Əvvəl maskalı nömrə görünür; klikdən sonra tam
 * nömrə, WhatsApp (yalnız mobil nömrədə) və e-poçt açılır.
 */
export function PublisherContactButtons({
  propertyId,
  endpoint,
  maskedPhone,
  hasEmail,
  whatsappMessage,
  labels,
}: {
  /** Analitika üçün id (elan id-si və ya agentlik slug-ı). */
  propertyId: string;
  /** Verilməsə elanın əlaqə ünvanı işlədilir. */
  endpoint?: string;
  maskedPhone: string | null;
  hasEmail: boolean;
  whatsappMessage: string;
  labels: PublisherContactLabels;
}) {
  const [contact, setContact] = useState<RevealedContact | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  async function reveal() {
    setLoading(true);
    setFailed(false);
    const result = await revealContact(endpoint ?? propertyContactEndpoint(propertyId));
    setLoading(false);
    if (!result) {
      setFailed(true);
      return;
    }
    setContact(result);
    trackEvent("phone_reveal", { property_id: propertyId, placement: "contact_card" });
  }

  if (!contact) {
    return (
      <div className="flex flex-col gap-2">
        {maskedPhone ? (
          <Button type="button" variant="ghost" fullWidth loading={loading} onClick={reveal} className="border border-line hover:border-gold hover:text-gold-deep">
            <Phone className="size-4" aria-hidden="true" />
            <span className="tabular">{maskedPhone}</span>
            <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-gold-deep">
              <Eye className="size-3.5" aria-hidden="true" />
              {labels.showPhone}
            </span>
          </Button>
        ) : (
          <p className="text-sm text-ink-muted">{labels.noPhone}</p>
        )}
        {!maskedPhone && hasEmail && (
          <Button type="button" variant="ghost" fullWidth loading={loading} onClick={reveal} className="border border-line hover:border-gold hover:text-gold-deep">
            <Mail className="size-4" aria-hidden="true" />
            {labels.showEmail}
          </Button>
        )}
        {failed && <p role="alert" className="text-xs text-danger">{labels.revealError}</p>}
      </div>
    );
  }

  const whatsapp = publisherWhatsappHref(contact.whatsapp || contact.phone, whatsappMessage);
  return (
    <div className="flex flex-col gap-2" aria-live="polite">
      {contact.phone && (
        <ButtonAnchor
          href={phoneHref(contact.phone)}
          variant="ghost"
          fullWidth
          className="border border-line hover:border-gold hover:text-gold-deep"
          onClick={() => trackEvent("phone_click", { property_id: propertyId, placement: "contact_card" })}
        >
          <Phone className="size-4" aria-hidden="true" />
          <span className="tabular">{contact.phone}</span>
        </ButtonAnchor>
      )}
      {whatsapp && (
        <ButtonAnchor
          href={whatsapp}
          variant="ghost"
          target="_blank"
          rel="noopener noreferrer"
          fullWidth
          className="border border-success/30 bg-success-bg text-success hover:border-success hover:bg-success-bg/70"
          onClick={() => trackEvent("whatsapp_click", { property_id: propertyId, placement: "contact_card" })}
        >
          <WhatsAppIcon className="size-4 text-success" />
          WhatsApp
        </ButtonAnchor>
      )}
      {contact.email && (
        <ButtonAnchor href={`mailto:${contact.email}`} variant="ghost" fullWidth className="border border-line hover:border-gold hover:text-gold-deep">
          <Mail className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{contact.email}</span>
        </ButtonAnchor>
      )}
    </div>
  );
}
