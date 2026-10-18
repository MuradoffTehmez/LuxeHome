import { describe, expect, it } from "vitest";
import { countByCategory, notificationFilterHref, notificationListWhere, notificationTypesFor, parseNotificationFilters } from "../notification-filters";
import { NOTIFICATION_TYPE_CATEGORY } from "../notification-categories";

describe("bildiriş mərkəzinin filtrləri", () => {
  it("defolt görünüş siyahıdır, parametrlər ayrıca tabdır", () => {
    expect(parseNotificationFilters({})).toEqual({ view: "list", read: "all", category: null });
    expect(parseNotificationFilters({ gorunus: "parametrler" }).view).toBe("settings");
    expect(parseNotificationFilters({ gorunus: "namelum" }).view).toBe("list");
  });

  it("naməlum status və kateqoriya defolta düşür", () => {
    expect(parseNotificationFilters({ status: "oxunmamis", kateqoriya: "LEADS" })).toEqual({ view: "list", read: "unread", category: "LEADS" });
    expect(parseNotificationFilters({ status: "x", kateqoriya: "DROP TABLE" })).toEqual({ view: "list", read: "all", category: null });
    expect(parseNotificationFilters({ status: ["oxunmus", "oxunmamis"] }).read).toBe("read");
  });

  it("URL defolt dəyərləri yazmır və parametrlər tabında filtrləri atır", () => {
    expect(notificationFilterHref({})).toBe("/kabinet/bildirisler");
    expect(notificationFilterHref({ read: "unread", category: "SECURITY" })).toBe("/kabinet/bildirisler?status=oxunmamis&kateqoriya=SECURITY");
    expect(notificationFilterHref({ view: "settings", read: "unread", category: "SECURITY" })).toBe("/kabinet/bildirisler?gorunus=parametrler");
    const state = parseNotificationFilters({ status: "oxunmus", kateqoriya: "VIP_PROMOTION" });
    expect(parseNotificationFilters(Object.fromEntries(new URLSearchParams(notificationFilterHref(state).split("?")[1])))).toEqual(state);
  });

  it("sorğu şərti oxunma və kateqoriyanı tiplərə çevirir", () => {
    expect(notificationListWhere({ view: "list", read: "all", category: null })).toEqual({});
    expect(notificationListWhere({ view: "list", read: "unread", category: null })).toEqual({ readAt: null });
    expect(notificationListWhere({ view: "list", read: "read", category: "VIP_PROMOTION" })).toEqual({ readAt: { not: null }, type: { in: ["VIP", "PROMOTION"] } });
  });

  it("hər bildiriş tipi tam bir kateqoriyanın siyahısına düşür", () => {
    const types = Object.keys(NOTIFICATION_TYPE_CATEGORY);
    const covered = new Set(Object.values(NOTIFICATION_TYPE_CATEGORY).flatMap((category) => notificationTypesFor(category)));
    expect(covered.size).toBe(types.length);
  });

  it("kateqoriya saylarını toplayır və naməlum tipi atır", () => {
    expect(countByCategory([{ type: "VIP", count: 2 }, { type: "PROMOTION", count: 3 }, { type: "LEGACY", count: 9 }, { type: "SECURITY", count: 1 }])).toEqual({ VIP_PROMOTION: 5, SECURITY: 1 });
  });
});
