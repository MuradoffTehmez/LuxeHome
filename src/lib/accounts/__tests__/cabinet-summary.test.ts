import { describe, expect, it } from "vitest";
import { ACCOUNT_TYPES } from "@/lib/constants";
import { getCabinetSummary } from "../cabinet-summary";

describe("kabinet xülasəsi", () => {
  it("agentlik üçün təsdiq vəziyyəti və öz elan sayını qaytarır", async () => {
    const summary = await getCabinetSummary(
      {
        async countProperties() {
          return 3;
        },
        async findAgency() {
          return { name: "Luxe Agentlik", isVerified: false };
        },
      },
      { id: "agency-user", accountType: ACCOUNT_TYPES.AGENCY },
    );

    expect(summary).toEqual({
      propertyCount: 3,
      agency: { name: "Luxe Agentlik", isVerified: false },
    });
  });

  it("adi istifadəçi üçün agentlik məlumatı olmadan xülasə yaradır", async () => {
    const summary = await getCabinetSummary(
      {
        async countProperties() {
          return 0;
        },
        async findAgency() {
          return null;
        },
      },
      { id: "visitor", accountType: ACCOUNT_TYPES.USER },
    );

    expect(summary).toEqual({ propertyCount: 0, agency: null });
  });
});
