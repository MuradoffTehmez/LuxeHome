import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ImagePrepareError,
  PREPARE_MAX_DIMENSION,
  PREPARE_PASSTHROUGH_BYTES,
  encodeCandidates,
  fitWithin,
  isImageCandidate,
  needsReencode,
  prepareImageForUpload,
} from "../image-prepare";

const MB = 1024 * 1024;

function fakeFile(type: string, size: number, name = "photo.jpg"): File {
  const file = new File([new Uint8Array(Math.min(size, 16))], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("seçim və qərar funksiyaları", () => {
  it("Windows-da boş MIME ilə gələn HEIC-i adından tanıyır", () => {
    expect(isImageCandidate({ type: "", size: 1, name: "IMG_0001.HEIC" })).toBe(true);
    expect(isImageCandidate({ type: "image/jpeg", size: 1, name: "a.jpg" })).toBe(true);
    expect(isImageCandidate({ type: "application/pdf", size: 1, name: "a.pdf" })).toBe(false);
  });

  it("kiçik və icazəli faylı dəyişmir, böyük, ölçüsü aşan və HEIC faylı yenidən kodlaşdırır", () => {
    expect(needsReencode({ type: "image/jpeg", size: MB, name: "a.jpg" }, { width: 1600, height: 1200 })).toBe(false);
    expect(needsReencode({ type: "image/jpeg", size: PREPARE_PASSTHROUGH_BYTES + 1, name: "a.jpg" })).toBe(true);
    expect(needsReencode({ type: "image/jpeg", size: MB, name: "a.jpg" }, { width: 4032, height: 3024 })).toBe(true);
    expect(needsReencode({ type: "image/heic", size: MB, name: "a.heic" })).toBe(true);
  });

  it("nisbəti qoruyaraq kiçildir, kiçik şəkli böyütmür", () => {
    expect(fitWithin(8000, 6000)).toEqual({ width: PREPARE_MAX_DIMENSION, height: 1800 });
    expect(fitWithin(3024, 4032)).toEqual({ width: 1800, height: PREPARE_MAX_DIMENSION });
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });

  it("şəffaf ola bilən mənbəni JPEG-dən əvvəl WebP və PNG ilə sınayır", () => {
    expect(encodeCandidates("image/png")).toEqual(["image/webp", "image/png", "image/jpeg"]);
    expect(encodeCandidates("image/jpeg")).toEqual(["image/jpeg"]);
    expect(encodeCandidates("image/heic")).toEqual(["image/jpeg"]);
  });
});

describe("prepareImageForUpload()", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** `createImageBitmap` və `OffscreenCanvas` brauzer API-lərini əvəzləyir. */
  function stubCanvas(bitmap: { width: number; height: number }, encoded: (type: string, quality: number) => Blob | null) {
    const drawImage = vi.fn();
    const close = vi.fn();
    vi.stubGlobal("createImageBitmap", vi.fn(async () => ({ ...bitmap, close })));
    vi.stubGlobal(
      "OffscreenCanvas",
      class {
        constructor(
          readonly width: number,
          readonly height: number,
        ) {}
        getContext() {
          return { drawImage };
        }
        async convertToBlob({ type, quality }: { type: string; quality: number }) {
          return encoded(type, quality);
        }
      },
    );
    return { drawImage, close };
  }

  it("12 MB-lıq 50 MP telefon şəklini 2400 px JPEG-ə çevirir və bitmap-i bağlayır", async () => {
    const { drawImage, close } = stubCanvas({ width: 8160, height: 6120 }, (type) =>
      new Blob([new Uint8Array(900_000)], { type }),
    );
    const result = await prepareImageForUpload(fakeFile("image/jpeg", 12 * MB, "IMG_1.jpeg"), 8 * MB);

    expect(result.type).toBe("image/jpeg");
    expect(result.name).toBe("IMG_1.jpg");
    expect(result.size).toBeLessThanOrEqual(8 * MB);
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 2400, 1800);
    expect(close).toHaveBeenCalled();
  });

  it("kiçik JPEG-i olduğu kimi saxlayır", async () => {
    const encode = vi.fn(() => new Blob([], { type: "image/jpeg" }));
    stubCanvas({ width: 1200, height: 800 }, encode);
    const original = fakeFile("image/jpeg", 400_000);
    await expect(prepareImageForUpload(original, 8 * MB)).resolves.toBe(original);
    expect(encode).not.toHaveBeenCalled();
  });

  it("Safari WebP yaza bilməyəndə şəffaf PNG-ni JPEG-ə deyil, PNG-yə yazır", async () => {
    stubCanvas({ width: 3000, height: 3000 }, (type) =>
      // WebP istənəndə brauzer səssizcə PNG qaytarır
      new Blob([new Uint8Array(500_000)], { type: type === "image/webp" ? "image/png" : type }),
    );
    const result = await prepareImageForUpload(fakeFile("image/png", 5 * MB, "logo.png"), 8 * MB);
    expect(result.type).toBe("image/png");
    expect(result.name).toBe("logo.png");
  });

  it("brauzer HEIC-i aça bilmirsə aydın xəta verir", async () => {
    vi.stubGlobal("createImageBitmap", vi.fn(async () => {
      throw new DOMException("decode", "InvalidStateError");
    }));
    await expect(prepareImageForUpload(fakeFile("image/heic", 3 * MB, "a.heic"), 8 * MB)).rejects.toEqual(
      new ImagePrepareError("unsupported"),
    );
  });

  it("brauzer aça bilmədiyi icazəli formatı serverə buraxır", async () => {
    vi.stubGlobal("createImageBitmap", vi.fn(async () => {
      throw new Error("decode");
    }));
    const avif = fakeFile("image/avif", 2 * MB, "a.avif");
    await expect(prepareImageForUpload(avif, 8 * MB)).resolves.toBe(avif);
  });

  it("bütün keyfiyyətlərdə limitə sığmırsa tooLarge atır", async () => {
    stubCanvas({ width: 9000, height: 9000 }, (type) => new Blob([new Uint8Array(10)], { type }));
    await expect(prepareImageForUpload(fakeFile("image/jpeg", 20 * MB), 5)).rejects.toEqual(
      new ImagePrepareError("tooLarge"),
    );
  });
});
