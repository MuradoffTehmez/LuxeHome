import { describe, expect, it } from "vitest";
import {
  publicPropertySchema,
  readPublicPropertyForm,
  hasExclusiveMediaOwnership,
  buildPublicPropertyData,
  createPropertyWithRelations,
  submissionPolicy,
} from "../property-submission";

function minimalForm(): FormData {
  const formData = new FormData();
  formData.set("title", "Yasamalda işıqlı üç otaqlı mənzil");
  formData.set("description", "Metroya yaxın, tam təmirli və yaşayış üçün hazır mənzil.");
  formData.set("listingType", "SALE");
  formData.set("price", "185000");
  formData.set("currency", "AZN");
  formData.set("typeId", "type_menzil");
  formData.set("cityId", "city_baki");
  formData.set("districtId", "");
  formData.set("address", "");
  formData.set("rooms", "3");
  formData.set("area", "92.5");
  return formData;
}

describe("ictimai elan göndərmə siyasəti", () => {
  it("mülk sahibinin elanını təsdiq gözləməyə göndərir", () => {
    expect(submissionPolicy("OWNER", false)).toEqual({ status: "PENDING", publishedAt: null });
  });

  it("təsdiqlənməmiş agentliyin elanını təsdiq gözləməyə göndərir", () => {
    expect(submissionPolicy("AGENCY", false)).toEqual({ status: "PENDING", publishedAt: null });
  });

  it("təsdiqlənmiş agentliyin elanını dərhal dərc edir", () => {
    const now = new Date("2026-08-22T12:00:00.000Z");
    expect(submissionPolicy("AGENCY", true, now)).toEqual({ status: "PUBLISHED", publishedAt: now });
  });

  it("yalnız ictimai formanın sahələrini oxuyur", () => {
    const formData = minimalForm();
    formData.set("status", "PUBLISHED");
    formData.set("authorId", "basqa-istifadeci");
    formData.set("isFeatured", "on");
    formData.set("metaTitle", "Gizli SEO idarəsi");

    const parsed = publicPropertySchema.parse(readPublicPropertyForm(formData));

    expect(parsed).not.toHaveProperty("status");
    expect(parsed).not.toHaveProperty("authorId");
    expect(parsed).not.toHaveProperty("isFeatured");
    expect(parsed).not.toHaveProperty("metaTitle");
  });

  it("göndərilən status və müəllif yerinə server dəyərlərini yazır", () => {
    const input = publicPropertySchema.parse(readPublicPropertyForm(minimalForm()));
    const now = new Date("2026-08-22T12:00:00.000Z");
    const data = buildPublicPropertyData(input, {
      userId: "hesab-sahibi",
      accountType: "AGENCY",
      agencyVerified: true,
      now,
    });

    expect(data).toMatchObject({
      authorId: "hesab-sahibi",
      status: "PUBLISHED",
      isFeatured: false,
      publishedAt: now,
    });
  });

  it("başqa istifadəçinin media URL-sini rədd edir", () => {
    expect(hasExclusiveMediaOwnership(["/media/emlaklar/one.webp"], [])).toBe(false);
  });

  it("yalnız özünə məxsus bütün media URL-lərini qəbul edir", () => {
    const urls = ["/media/emlaklar/one.webp", "/media/emlaklar/two.webp"];
    expect(hasExclusiveMediaOwnership(urls, [...urls])).toBe(true);
  });

  it("əlaqələr yazılmasa yarımçıq Property qeydini silir", async () => {
    const deleted: string[] = [];
    await expect(
      createPropertyWithRelations(
        {
          createProperty: async () => ({ id: "property-1" }),
          createRelations: async () => {
            throw new Error("FK xətası");
          },
          deleteProperty: async (id) => {
            deleted.push(id);
          },
        },
        {},
      ),
    ).rejects.toThrow("FK xətası");

    expect(deleted).toEqual(["property-1"]);
  });
});
