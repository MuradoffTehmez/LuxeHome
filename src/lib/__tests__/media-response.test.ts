import { describe, expect, it } from "vitest";
import { mediaKeyFromPath, mediaResponse, mediaVariantFromSearch, resizedMediaResponse } from "@/lib/media-response";

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
    expect((await resizedMediaResponse(bucket, imagesBinding(() => undefined), "a/yox.webp", { width: 640, quality: 75 })).status).toBe(404);
  });
});
