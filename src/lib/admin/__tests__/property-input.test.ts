import { describe, expect, it } from "vitest";
import { propertySchema } from "../schemas";
import { propertyData, readPropertyForm } from "../property-input";

/**
 * Brauzerin göndərdiyi forma ilə serverin oxuduğu sahə adları arasındakı uyğunluğu
 * qoruyur. Uyğunsuzluq istifadəçiyə «elan yaradılmır» kimi görünür və səbəbi
 * heç bir yerdə yazılmır — ona görə bu yol testlə bağlanıb.
 */

/** `PropertyForm`-un minimal doldurulmuş halında göndərdiyi sahələr. */
function minimalSaleForm(): FormData {
  const formData = new FormData();
  formData.set("title", "Yasamalda 3 otaqlı mənzil");
  formData.set("slug", "");
  formData.set("description", "Geniş, işıqlı mənzil, metroya yaxın, tam təmirli vəziyyətdə.");
  formData.set("listingType", "SALE");
  formData.set("status", "PUBLISHED");
  formData.set("price", "185000");
  formData.set("currency", "AZN");
  formData.set("typeId", "type_menzil");
  formData.set("cityId", "city_baki");
  // Seçilməmiş açılan siyahılar boş sətir göndərir
  formData.set("districtId", "");
  formData.set("metroId", "");
  formData.set("projectId", "");
  formData.set("address", "");
  formData.set("latitude", "");
  formData.set("longitude", "");
  formData.set("rooms", "3");
  formData.set("bedrooms", "");
  formData.set("bathrooms", "");
  formData.set("area", "92.5");
  formData.set("landArea", "");
  formData.set("floor", "");
  formData.set("totalFloors", "");
  formData.set("renovation", "");
  formData.set("documentStatus", "");
  formData.set("buildingType", "");
  formData.set("videoUrl", "");
  formData.set("metaTitle", "");
  formData.set("metaDescription", "");
  return formData;
}

/** Ödəniş bayraqları artıq formadan deyil, xüsusiyyət seçimindən gəlir. */
const NO_PAYMENT = { mortgageAvailable: false, installmentAvailable: false };

describe("əmlak formasının oxunması", () => {
  it("minimal satış elanını qəbul edir", () => {
    const parsed = propertySchema.safeParse(readPropertyForm(minimalSaleForm()));
    expect(parsed.success, JSON.stringify(parsed.error?.issues)).toBe(true);
  });

  it("işarələnməmiş checkbox-ları false kimi oxuyur", () => {
    const parsed = propertySchema.parse(readPropertyForm(minimalSaleForm()));
    expect(parsed.isFeatured).toBe(false);
    expect(parsed.reservationEnabled).toBe(false);
  });

  it("vergüllü onluq ayırıcını qəbul edir", () => {
    const formData = minimalSaleForm();
    formData.set("area", "92,5");
    expect(propertySchema.parse(readPropertyForm(formData)).area).toBe(92.5);
  });

  it("kirayə elanında qiymət dövrü tələb edir", () => {
    const formData = minimalSaleForm();
    formData.set("listingType", "RENT");
    const parsed = propertySchema.safeParse(readPropertyForm(formData));

    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues.some((issue) => issue.path[0] === "pricePeriod")).toBe(true);
  });

  it("kirayə elanı dövrlə keçir", () => {
    const formData = minimalSaleForm();
    formData.set("listingType", "RENT");
    formData.set("pricePeriod", "MONTH");
    expect(propertySchema.safeParse(readPropertyForm(formData)).success).toBe(true);
  });

  it("satış elanında qiymət dövrünü təmizləyir", () => {
    const formData = minimalSaleForm();
    formData.set("pricePeriod", "MONTH");
    const data = propertyData(propertySchema.parse(readPropertyForm(formData)), NO_PAYMENT);
    expect(data.pricePeriod).toBeNull();
  });

  it("çoxseçimli xüsusiyyətləri massiv kimi oxuyur", () => {
    const formData = minimalSaleForm();
    formData.append("featureIds", "feature_lift");
    formData.append("featureIds", "feature_qaraj");
    expect(propertySchema.parse(readPropertyForm(formData)).featureIds).toEqual([
      "feature_lift",
      "feature_qaraj",
    ]);
  });

  it("optional metro əlaqəsini formadan Prisma datasına ötürür", () => {
    const formData = minimalSaleForm();
    formData.set("metroId", "metro_nerimanov");
    const data = propertyData(propertySchema.parse(readPropertyForm(formData)), NO_PAYMENT);

    expect(data.metroId).toBe("metro_nerimanov");
  });

  it("boş video ünvanını xəta saymır", () => {
    expect(propertySchema.parse(readPropertyForm(minimalSaleForm())).videoUrl).toBeNull();
  });

  it("javascript: sxemli video ünvanını rədd edir", () => {
    const formData = minimalSaleForm();
    formData.set("videoUrl", "javascript:alert(1)");
    expect(propertySchema.safeParse(readPropertyForm(formData)).success).toBe(false);
  });

  it("mərtəbə binanın mərtəbə sayından çox ola bilməz", () => {
    const formData = minimalSaleForm();
    formData.set("floor", "9");
    formData.set("totalFloors", "5");
    const parsed = propertySchema.safeParse(readPropertyForm(formData));

    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues.some((issue) => issue.path[0] === "floor")).toBe(true);
  });
});
