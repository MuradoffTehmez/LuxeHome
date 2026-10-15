import { describe, expect, it } from "vitest";
import { mediaKeyFromPath, mediaResponse } from "@/lib/media-response";

function bucketWith(objects: Record<string, { body: string; contentType?: string }>): R2Bucket {
  return {
    async get(key: string) {
      const object = objects[key];
      if (!object) return null;
      return {
        body: new Response(object.body).body,
        httpEtag: `"${key}"`,
        httpMetadata: { contentType: object.contentType },
      };
    },
  } as unknown as R2Bucket;
}

describe("media cavabı", () => {
  it("yalnız gözlənilən formalı açarı qəbul edir", () => {
    expect(mediaKeyFromPath("/media/emlaklar/2026/10/a-b_c.webp")).toBe("emlaklar/2026/10/a-b_c.webp");
    expect(mediaKeyFromPath("/media/umumi/x.JPG")).toBe("umumi/x.JPG");
    expect(mediaKeyFromPath("/media/../secret.webp")).toBeNull();
    expect(mediaKeyFromPath("/media/x.svg")).toBeNull();
    expect(mediaKeyFromPath("/media/x.html")).toBeNull();
    expect(mediaKeyFromPath("/az/media/x.webp")).toBeNull();
  });

  it("şəkli dəyişməz keş və təhlükəsiz başlıqlarla verir", async () => {
    const response = await mediaResponse(bucketWith({ "a/x.webp": { body: "img", contentType: "image/webp" } }), "a/x.webp");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/webp");
    expect(response.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("content-disposition")).toBe("inline");
    expect(response.headers.get("etag")).toBe('"a/x.webp"');
    expect(await response.text()).toBe("img");
  });

  it("icazəsiz MIME tipini octet-stream kimi verir", async () => {
    const response = await mediaResponse(bucketWith({ "a/x.png": { body: "<html>", contentType: "text/html" } }), "a/x.png");
    expect(response.headers.get("content-type")).toBe("application/octet-stream");
  });

  it("yoxdursa və ya açar etibarsızdırsa keşlənməyən 404 qaytarır", async () => {
    const bucket = bucketWith({});
    for (const response of [await mediaResponse(bucket, "a/x.webp"), await mediaResponse(bucket, null), await mediaResponse(undefined, "a/x.webp")]) {
      expect(response.status).toBe(404);
      expect(response.headers.get("cache-control")).toBe("no-store");
    }
  });
});
