import { describe, expect, it } from "vitest";
import { PERMISSIONS, ROLES } from "@/lib/constants";
import { hasPermission } from "../permissions";

describe("icazə matrisi", () => {
  it("SUPER_ADMIN bütün icazələri alır", () => {
    for (const permission of Object.values(PERMISSIONS)) {
      expect(hasPermission(ROLES.SUPER_ADMIN, permission)).toBe(true);
    }
  });

  it("ADMIN məzmunu idarə edir, istifadəçi və parametrləri yox", () => {
    expect(hasPermission(ROLES.ADMIN, PERMISSIONS.PROPERTY_MANAGE)).toBe(true);
    expect(hasPermission(ROLES.ADMIN, PERMISSIONS.LEAD_MANAGE)).toBe(true);
    expect(hasPermission(ROLES.ADMIN, PERMISSIONS.USER_MANAGE)).toBe(false);
    expect(hasPermission(ROLES.ADMIN, PERMISSIONS.SETTINGS_MANAGE)).toBe(false);
  });

  it("EDITOR yalnız blog və media idarə edir", () => {
    expect(hasPermission(ROLES.EDITOR, PERMISSIONS.BLOG_MANAGE)).toBe(true);
    expect(hasPermission(ROLES.EDITOR, PERMISSIONS.MEDIA_MANAGE)).toBe(true);
    expect(hasPermission(ROLES.EDITOR, PERMISSIONS.PROPERTY_MANAGE)).toBe(false);
    expect(hasPermission(ROLES.EDITOR, PERMISSIONS.LEAD_MANAGE)).toBe(false);
  });

  it("tanınmayan rol heç nə ala bilmir", () => {
    // Bazadakı rol sətri sabitlərdən kənara çıxsa, sistem bağlı qalmalıdır
    expect(hasPermission("MÜHASİB" as never, PERMISSIONS.BLOG_MANAGE)).toBe(false);
  });
});
