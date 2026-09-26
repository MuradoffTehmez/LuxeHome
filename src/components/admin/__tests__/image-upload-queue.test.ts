import { describe, expect, it, vi } from "vitest";
import {
  UPLOAD_CONCURRENCY,
  createUploadLimiter,
  isRetryable,
  readUploadResponse,
  uploadWithRetry,
} from "../image-upload-queue";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("readUploadResponse()", () => {
  it("uğurlu cavabdan URL-i götürür", async () => {
    await expect(readUploadResponse(json(201, { url: "/media/a.webp" }))).resolves.toEqual({
      ok: true,
      url: "/media/a.webp",
    });
  });

  it("Cloudflare HTML xəta səhifəsində «Unexpected token» atmır, server xətası sayır", async () => {
    const html = new Response("<!DOCTYPE html><title>Worker exceeded resource limits</title>", { status: 503 });
    await expect(readUploadResponse(html)).resolves.toEqual({ ok: false, kind: "server", message: undefined });
  });

  it("200 statuslu, lakin JSON olmayan cavabı da server xətası sayır", async () => {
    await expect(readUploadResponse(new Response("<html>", { status: 200 }))).resolves.toMatchObject({
      ok: false,
      kind: "server",
    });
  });

  it("status kodlarını təsnif edir və server mesajını saxlayır", async () => {
    await expect(readUploadResponse(json(429, { error: "Çox" }))).resolves.toEqual({
      ok: false,
      kind: "rateLimited",
      message: "Çox",
    });
    await expect(readUploadResponse(json(413, { error: "Böyük" }))).resolves.toMatchObject({ kind: "tooLarge" });
    await expect(readUploadResponse(json(400, { error: "Format" }))).resolves.toEqual({
      ok: false,
      kind: "rejected",
      message: "Format",
    });
  });
});

describe("isRetryable()", () => {
  it("yalnız keçici xətaları təkrarlayır", () => {
    expect(isRetryable("network")).toBe(true);
    expect(isRetryable("rateLimited")).toBe(true);
    expect(isRetryable("server")).toBe(true);
    expect(isRetryable("rejected")).toBe(false);
    expect(isRetryable("tooLarge")).toBe(false);
  });
});

describe("uploadWithRetry()", () => {
  const sleep = vi.fn(async () => undefined);

  it("keçici xətadan sonra təkrar cəhd edib uğur qaytarır", async () => {
    const send = vi
      .fn<() => Promise<Response>>()
      .mockResolvedValueOnce(new Response("<html>", { status: 503 }))
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(json(201, { url: "/media/ok.webp" }));

    await expect(uploadWithRetry(send, { sleep })).resolves.toEqual({ ok: true, url: "/media/ok.webp" });
    expect(send).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it("qəti imtinanı təkrarlamır", async () => {
    const send = vi.fn(async () => json(400, { error: "Yalnız JPEG" }));
    await expect(uploadWithRetry(send, { sleep })).resolves.toMatchObject({ ok: false, kind: "rejected" });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("cəhd limitində dayanır və son xətanı qaytarır", async () => {
    const send = vi.fn(async () => json(429, { error: "Çox" }));
    await expect(uploadWithRetry(send, { sleep, maxAttempts: 3 })).resolves.toMatchObject({ kind: "rateLimited" });
    expect(send).toHaveBeenCalledTimes(3);
  });
});

describe("createUploadLimiter()", () => {
  it("20 fayl toplu seçiləndə eyni anda ən çox UPLOAD_CONCURRENCY sorğu gedir", async () => {
    const run = createUploadLimiter();
    let active = 0;
    let peak = 0;
    const task = async (value: number) => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 1));
      active -= 1;
      return value;
    };

    const results = await Promise.all(Array.from({ length: 20 }, (_, index) => run(() => task(index))));
    expect(results).toEqual(Array.from({ length: 20 }, (_, index) => index));
    expect(peak).toBe(UPLOAD_CONCURRENCY);
  });

  it("yükləmə davam edərkən əlavə olunan dəst də eyni limitə tabedir", async () => {
    const run = createUploadLimiter(2);
    let active = 0;
    let peak = 0;
    const task = () =>
      run(async () => {
        active += 1;
        peak = Math.max(peak, active);
        await new Promise((resolve) => setTimeout(resolve, 2));
        active -= 1;
      });

    const first = Array.from({ length: 5 }, task);
    await new Promise((resolve) => setTimeout(resolve, 1));
    const second = Array.from({ length: 5 }, task);
    await Promise.all([...first, ...second]);
    expect(peak).toBe(2);
  });

  it("uğursuz tapşırıq növbəni dayandırmır", async () => {
    const run = createUploadLimiter(1);
    const outcomes = await Promise.allSettled([
      run(async () => {
        throw new Error("x");
      }),
      run(async () => "ok"),
    ]);
    expect(outcomes.map((outcome) => outcome.status)).toEqual(["rejected", "fulfilled"]);
  });
});
