import { describe, expect, it } from "vitest";
import { BACKFILL_GRACE_DAYS, LISTING_LIFETIME_DAYS, backfillExpiry, expiryState, publicationExpiryReset, renewedExpiry } from "@/lib/listing-expiry-policy";

const DAY = 86_400_000;
const now = new Date("2026-09-27T12:00:00Z");

describe("elan müddəti", () => {
  it("dərc olunmuş elan üçün qalan günü və xatırlatma pəncərəsini göstərir", () => {
    expect(expiryState({ status: "PUBLISHED", listingExpiresAt: new Date(now.getTime() + 20 * DAY), expiredAt: null }, now.getTime())).toEqual({ state: "active", daysLeft: 20 });
    expect(expiryState({ status: "PUBLISHED", listingExpiresAt: new Date(now.getTime() + 3 * DAY), expiredAt: null }, now.getTime())).toEqual({ state: "expiring", daysLeft: 3 });
    expect(expiryState({ status: "ARCHIVED", listingExpiresAt: now, expiredAt: now }, now.getTime())).toEqual({ state: "expired", daysLeft: 0 });
    // Müddətsiz (şirkət elanı) və ya əl ilə arxivlənmiş elan göstərici almır.
    expect(expiryState({ status: "PUBLISHED", listingExpiresAt: null, expiredAt: null }, now.getTime())).toBeNull();
    expect(expiryState({ status: "ARCHIVED", listingExpiresAt: now, expiredAt: null }, now.getTime())).toBeNull();
  });

  it("köhnə elana qəfil arxiv olmasın deyə güzəşt verir", () => {
    const old = new Date(now.getTime() - 200 * DAY);
    expect(backfillExpiry(old, now).getTime()).toBe(now.getTime() + BACKFILL_GRACE_DAYS * DAY);
    const recent = new Date(now.getTime() - 10 * DAY);
    expect(backfillExpiry(recent, now).getTime()).toBe(recent.getTime() + LISTING_LIFETIME_DAYS * DAY);
    expect(renewedExpiry(now).getTime()).toBe(now.getTime() + LISTING_LIFETIME_DAYS * DAY);
  });

  it("yenidən dərcdə yalnız köhnəlmiş müddəti təzələyir", () => {
    const fresh = { listingExpiresAt: renewedExpiry(now), expiryReminderSentAt: null, expiredAt: null };
    // Müddəti bitib arxivlənmiş elan
    expect(publicationExpiryReset({ listingExpiresAt: new Date(now.getTime() - DAY), expiredAt: new Date(now.getTime() - DAY) }, now)).toEqual(fresh);
    // Admin arxivləyib, müddət bu arada keçib
    expect(publicationExpiryReset({ listingExpiresAt: new Date(now.getTime() - DAY), expiredAt: null }, now)).toEqual(fresh);
    // Qüvvədə olan müddətə toxunulmur, müddəti olmayana da (gündəlik iş təyin edir)
    expect(publicationExpiryReset({ listingExpiresAt: new Date(now.getTime() + 10 * DAY), expiredAt: null }, now)).toEqual({});
    expect(publicationExpiryReset({ listingExpiresAt: null, expiredAt: null }, now)).toEqual({});
  });
});
