import { describe, expect, it } from "vitest";
import {
  MEDIA_NO_EDGE_CACHE_HEADER,
  mediaCacheKey,
  mediaKeyFromPath,
  mediaResponse,
  mediaVariantFromSearch,
  purgeMediaCache,
  resizedMediaResponse,
} from "@/lib/media-response";

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

describe("media nüsxəsi (?w=&q=)", () => {
  it("yalnız next.config siyahısındakı en və keyfiyyəti qəbul edir", () => {
    expect(mediaVariantFromSearch(new URLSearchParams(""))).toBeNull();
    expect(mediaVariantFromSearch(new URLSearchParams("v=3"))).toBeNull();
    expect(mediaVariantFromSearch(new URLSearchParams("w=828"))).toEqual({ width: 828, quality: 75 });
    expect(mediaVariantFromSearch(new URLSearchParams("w=1080&q=65"))).toEqual({ width: 1080, quality: 65 });
    expect(mediaVariantFromSearch(new URLSearchParams("w=829"))).toBe("invalid");
    expect(mediaVariantFromSearch(new URLSearchParams("w=828&q=90"))).toBe("invalid");
    expect(mediaVariantFromSearch(new URLSearchParams("w=abc"))).toBe("invalid");
  });

  function imagesBinding(onTransform: (options: unknown) => void, fail = false): ImagesBinding {
    return {
      input: () => ({
        transform(options: unknown) {
          onTransform(options);
          return this;
        },
        async output(options: { format: string }) {
          if (fail) throw new Error("9412");
          return { image: () => new Response("small").body, contentType: () => options.format };
        },
      }),
    } as unknown as ImagesBinding;
  }

  it("orijinalı scale-down ilə WebP-yə kiçildir və dəyişməz keşlə verir", async () => {
    const transforms: unknown[] = [];
    const response = await resizedMediaResponse(
      bucketWith({ "a/x.webp": { body: "big", contentType: "image/webp" } }),
      imagesBinding((options) => transforms.push(options)),
      "a/x.webp",
      { width: 640, quality: 75 },
    );
    expect(transforms).toEqual([{ width: 640, fit: "scale-down" }]);
    expect(response.headers.get("content-type")).toBe("image/webp");
    expect(response.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(await response.text()).toBe("small");
  });

  it("çevirmə alınmasa və ya binding yoxdursa orijinalı verir", async () => {
    const bucket = bucketWith({ "a/x.webp": { body: "big", contentType: "image/webp" } });
    const failed = await resizedMediaResponse(bucket, imagesBinding(() => undefined, true), "a/x.webp", { width: 640, quality: 75 });
    expect(await failed.text()).toBe("big");
    const unbound = await resizedMediaResponse(bucket, undefined, "a/x.webp", { width: 640, quality: 75 });
    expect(await unbound.text()).toBe("big");
    // Ehtiyat cavab kənar keşə yazılmamalı və brauzerdə qısa yaşamalıdır — çevirmə yenidən sınansın.
    for (const response of [failed, unbound]) {
      expect(response.headers.get(MEDIA_NO_EDGE_CACHE_HEADER)).toBe("1");
      expect(response.headers.get("cache-control")).toBe("public, max-age=300");
    }
    expect((await resizedMediaResponse(bucket, imagesBinding(() => undefined), "a/yox.webp", { width: 640, quality: 75 })).status).toBe(404);
  });
});

describe("media kənar keşinin təmizlənməsi", () => {
  it("açar host-dan asılı deyil, nüsxə eni və keyfiyyəti daşıyır", () => {
    expect(mediaCacheKey("/media/a/x.webp")).toBe("https://media-cache.internal/media/a/x.webp");
    expect(mediaCacheKey("/media/a/x.webp", { width: 640, quality: 75 })).toBe("https://media-cache.internal/media/a/x.webp?w=640&q=75");
  });

  it("silinən şəklin kiçildilmiş nüsxələrini də götürür", async () => {
    const cache = (caches as unknown as { default: Cache }).default;
    const variants = [{ width: 360, quality: 75 }, { width: 1920, quality: 65 }, { width: 64, quality: 75 }];
    for (const variant of variants) await cache.put(mediaCacheKey("/media/b/x.webp", variant), new Response("img"));

    await purgeMediaCache(["/media/b/x.webp"]);

    for (const variant of variants) expect(await cache.match(mediaCacheKey("/media/b/x.webp", variant))).toBeUndefined();
  });

  it("silinən şəklin keş girişini götürür, digərinə toxunmur", async () => {
    const cache = (caches as unknown as { default: Cache }).default;
    const put = (path: string) =>
      cache.put(mediaCacheKey(path), new Response("img", { headers: { "cache-control": "public, max-age=86400" } }));
    await put("/media/a/x.webp");
    await put("/media/a/x-thumb.webp");
    await put("/media/a/y.webp");

    await purgeMediaCache(["/media/a/x.webp", "/media/a/x-thumb.webp"]);

    expect(await cache.match(mediaCacheKey("/media/a/x.webp"))).toBeUndefined();
    expect(await cache.match(mediaCacheKey("/media/a/x-thumb.webp"))).toBeUndefined();
    expect(await cache.match(mediaCacheKey("/media/a/y.webp"))).toBeDefined();
  });
});
