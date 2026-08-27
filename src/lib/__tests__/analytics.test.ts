import { describe, expect, it } from "vitest";
import { analyticsFailureReason } from "@/lib/analytics";

describe("Cloudflare analitika xəta mətnləri", () => {
  it("provider-in actor identifikatorunu gizlədib icazə addımını göstərir", () => {
    const providerMessage =
      "Actor 'com.cloudflare.api.token.secret-id' does not have permission " +
      "'com.cloudflare.api.account.zone.analytics.read' for zone 'secret-zone'";

    const reason = analyticsFailureReason(undefined, [providerMessage]);

    expect(reason).toContain("Analytics: Read");
    expect(reason).toContain("CLOUDFLARE_ANALYTICS_TOKEN");
    expect(reason).not.toContain("secret-id");
    expect(reason).not.toContain("secret-zone");
  });

  it("HTTP icazə və limit xətalarını ayrıca izah edir", () => {
    expect(analyticsFailureReason(403)).toContain("icazəsi yoxdur");
    expect(analyticsFailureReason(429)).toContain("limitə çatıb");
    expect(analyticsFailureReason(502)).toContain("HTTP 502");
  });

  it("naməlum GraphQL detalını istifadəçiyə sızdırmır", () => {
    expect(analyticsFailureReason(undefined, ["internal provider detail"])).toBe(
      "Cloudflare analitika sorğusu tamamlanmadı. Bir qədər sonra yenidən yoxlayın.",
    );
  });
});
