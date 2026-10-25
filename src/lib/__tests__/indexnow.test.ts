import { describe, expect, it } from "vitest";
import { siteUrl } from "@/config/site";
import { buildIndexNowPayload, indexNowEnabled, indexNowKey, INDEXNOW_KEY_PATH } from "@/lib/indexnow";

describe("IndexNow (#289)", () => {
  it("açar sirrdən sabit törədilir və protokol formatındadır", async () => {
    const key = await indexNowKey("test-secret");
    expect(key).toMatch(/^[0-9a-f]{32}$/);
    expect(await indexNowKey("test-secret")).toBe(key);
    expect(await indexNowKey("başqa-sirr")).not.toBe(key);
  });

  it("gövdə mütləq URL-lər daşıyır, sitemap və təkrarları atır", () => {
    const payload = buildIndexNowPayload(["/az/emlaklar/x", "/az/emlaklar/x", "/sitemap.xml", "/ru/emlaklar"], "abc");
    expect(payload.key).toBe("abc");
    expect(payload.host).toBe(new URL(siteUrl()).host);
    expect(payload.keyLocation).toBe(siteUrl(INDEXNOW_KEY_PATH));
    expect(payload.urlList).toEqual([siteUrl("/az/emlaklar/x"), siteUrl("/ru/emlaklar")]);
  });

  it("test/staging mühitində göndəriş söndürülüdür", () => {
    expect(indexNowEnabled()).toBe(false);
  });
});
