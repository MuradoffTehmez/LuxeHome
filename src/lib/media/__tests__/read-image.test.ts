import { beforeEach, describe, expect, it, vi } from "vitest";

const bucket = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: () => ({ env: { MEDIA: bucket } }),
}));

import { readPreferredImageBytes } from "@/lib/media/read-image";

function object(bytes: number[]) {
  return { arrayBuffer: async () => new Uint8Array(bytes).buffer };
}

describe("readPreferredImageBytes", () => {
  beforeEach(() => {
    bucket.get.mockReset();
  });

  it("kiçik nüsxə varsa onu oxuyur", async () => {
    bucket.get.mockImplementation(async (key: string) => (key === "emlaklar/a-thumb.webp" ? object([1]) : object([2])));

    expect(await readPreferredImageBytes("/media/emlaklar/a-thumb.webp", "/media/emlaklar/a.webp")).toEqual(new Uint8Array([1]));
    expect(bucket.get).toHaveBeenCalledTimes(1);
  });

  it("kiçik nüsxə R2-də yoxdursa orijinala düşür", async () => {
    // `storeImage()` kiçik nüsxənin yazılma xətasını udur, amma `thumbUrl` qaytarır
    bucket.get.mockImplementation(async (key: string) => (key === "emlaklar/a.webp" ? object([2]) : null));

    expect(await readPreferredImageBytes("/media/emlaklar/a-thumb.webp", "/media/emlaklar/a.webp")).toEqual(new Uint8Array([2]));
  });

  it("kiçik nüsxəni oxumaq xəta atsa da orijinala düşür", async () => {
    bucket.get.mockImplementation(async (key: string) => {
      if (key === "emlaklar/a-thumb.webp") throw new Error("R2");
      return object([3]);
    });

    expect(await readPreferredImageBytes("/media/emlaklar/a-thumb.webp", "/media/emlaklar/a.webp")).toEqual(new Uint8Array([3]));
  });

  it("thumbUrl yoxdursa birbaşa orijinalı oxuyur", async () => {
    bucket.get.mockResolvedValue(object([4]));

    expect(await readPreferredImageBytes(null, "/media/emlaklar/a.webp")).toEqual(new Uint8Array([4]));
    expect(bucket.get).toHaveBeenCalledWith("emlaklar/a.webp");
  });
});
