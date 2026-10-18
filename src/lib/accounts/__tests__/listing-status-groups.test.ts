import { describe, expect, it } from "vitest";
import { PROPERTY_STATUSES } from "@/lib/constants";
import { countListingStatusGroups, inListingStatusGroup, listingStatusGroupHref, parseListingStatusGroup } from "../listing-status-groups";

describe("Elanlarım status tabları", () => {
  it("URL dəyərini oxuyur və yazır, naməlum dəyər «hamısı»dır", () => {
    expect(parseListingStatusGroup("diqqet")).toBe("attention");
    expect(parseListingStatusGroup(undefined)).toBe("all");
    expect(parseListingStatusGroup("x")).toBe("all");
    expect(listingStatusGroupHref("closed")).toBe("/kabinet/elanlar?status=baglanmis");
    expect(listingStatusGroupHref("all")).toBe("/kabinet/elanlar");
  });

  it("hər status bir qrupa düşür və saylar cəmi «hamısı»na bərabərdir", () => {
    const statuses = Object.values(PROPERTY_STATUSES);
    const counts = countListingStatusGroups(statuses);
    expect(counts.all).toBe(statuses.length);
    expect(counts.active + counts.review + counts.attention + counts.closed).toBe(statuses.length);
    expect(counts.attention).toBe(3);
  });

  it("düzəliş tələb olunan elan «diqqət» tabındadır", () => {
    expect(inListingStatusGroup(PROPERTY_STATUSES.NEEDS_INFO, "attention")).toBe(true);
    expect(inListingStatusGroup(PROPERTY_STATUSES.NEEDS_INFO, "active")).toBe(false);
    expect(inListingStatusGroup(PROPERTY_STATUSES.SOLD, "all")).toBe(true);
  });
});
