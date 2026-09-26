import { describe, expect, it } from "vitest";
import { putImage, uploadFailureStatus } from "../storage";

/**
 * Client növbəsi (#79) statusa görə qərar verir: 413/400 qəti imtinadır,
 * 429/503 isə keçicidir və təkrar cəhd olunur.
 */
describe("yükləmə xətalarının HTTP statusu", () => {
  it("ölçü xətası 413, anbar əlçatmazlığı 503, qalanı 400 qaytarır", () => {
    expect(uploadFailureStatus("tooLarge")).toBe(413);
    expect(uploadFailureStatus("storage")).toBe(503);
    expect(uploadFailureStatus("unsupported")).toBe(400);
    expect(uploadFailureStatus("empty")).toBe(400);
  });

  it("putImage səbəbi qaytarır — boş və ölçüsü aşan fayl binding-ə getmədən rədd olunur", async () => {
    await expect(putImage(new File([], "a.jpg", { type: "image/jpeg" }), "emlaklar")).resolves.toMatchObject({
      ok: false,
      reason: "empty",
    });
    const huge = new File([new Uint8Array(9 * 1024 * 1024)], "a.jpg", { type: "image/jpeg" });
    await expect(putImage(huge, "emlaklar")).resolves.toMatchObject({ ok: false, reason: "tooLarge" });
  });
});
