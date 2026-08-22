import { describe, expect, it } from "vitest";
import {
  publicPropertySchema,
  readPublicPropertyForm,
  hasExclusiveMediaOwnership,
  buildPublicPropertyData,
  createPropertyWithRelations,
  hasAllowedPropertyImageCount,
  validatePublicPropertyRelations,
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
    const data = buildPublicPropertyData(input, {
      userId: "hesab-sahibi",
    });

    expect(data).toMatchObject({
      authorId: "hesab-sahibi",
      status: "PENDING",
      isFeatured: false,
      publishedAt: null,
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

  it("təsdiqlənmiş agentliyi yalnız əlaqələrdən sonra dərc edir", async () => {
    const events: string[] = [];
    await createPropertyWithRelations(
      {
        createProperty: async (data: { status: string }) => {
          events.push(`create:${data.status}`);
          return { id: "property-1" };
        },
        createRelations: async () => {
          events.push("relations");
        },
        finalizeProperty: async () => {
          events.push("finalize");
        },
        deleteProperty: async () => {
          events.push("delete");
        },
      },
      { status: "PENDING" },
      true,
    );

    expect(events).toEqual(["create:PENDING", "relations", "finalize"]);
  });

  it("dərc addımı uğursuz olarsa PENDING Property-ni silməyə çalışır", async () => {
    const events: string[] = [];
    await expect(
      createPropertyWithRelations(
        {
          createProperty: async () => {
            events.push("create");
            return { id: "property-1" };
          },
          createRelations: async () => {
            events.push("relations");
          },
          finalizeProperty: async () => {
            events.push("finalize");
            throw new Error("dərc xətası");
          },
          deleteProperty: async () => {
            events.push("delete");
          },
        },
        {},
        true,
      ),
    ).rejects.toThrow("dərc xətası");

    expect(events).toEqual(["create", "relations", "finalize", "delete"]);
  });

  it("silinmə kompensasiyası alınmasa da əsas xəta saxlanır", async () => {
    await expect(
      createPropertyWithRelations(
        {
          createProperty: async () => ({ id: "property-1" }),
          createRelations: async () => {
            throw new Error("əlaqə xətası");
          },
          finalizeProperty: async () => undefined,
          deleteProperty: async () => {
            throw new Error("silinmə xətası");
          },
        },
        {},
        false,
      ),
    ).rejects.toThrow("əlaqə xətası");
  });

  it("iyirmidən çox şəkilli elanı rədd edir", () => {
    expect(hasAllowedPropertyImageCount(20)).toBe(true);
    expect(hasAllowedPropertyImageCount(21)).toBe(false);
  });

  it("qeyri-aktiv əmlak növünü rədd edir", async () => {
    const errors = await validatePublicPropertyRelations(
      {
        findType: async () => ({ isActive: false }),
        findLocation: async () => ({ kind: "CITY", parentId: null }),
        countFeatures: async () => 0,
      },
      { typeId: "type", cityId: "city", districtId: null, featureIds: [] },
    );
    expect(errors).toMatchObject({ typeId: "Əmlak növü seçilməyib" });
  });

  it("CITY olmayan şəhər və uyğun olmayan rayon növünü rədd edir", async () => {
    const errors = await validatePublicPropertyRelations(
      {
        findType: async () => ({ isActive: true }),
        findLocation: async (id) =>
          id === "city"
            ? { kind: "DISTRICT", parentId: null }
            : { kind: "LANDMARK", parentId: "city" },
        countFeatures: async () => 0,
      },
      { typeId: "type", cityId: "city", districtId: "district", featureIds: [] },
    );
    expect(errors).toMatchObject({
      cityId: "Şəhər seçilməyib",
      districtId: "Seçilmiş rayon düzgün deyil",
    });
  });
});
