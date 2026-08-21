import { describe, expect, it } from "vitest";
import { hashPassword, needsRehash, verifyPassword } from "../password";

describe("parol hash-ı", () => {
  it("doğru parolu qəbul edir", async () => {
    const stored = await hashPassword("Luxe-2026-Test!");
    expect(await verifyPassword("Luxe-2026-Test!", stored)).toBe(true);
  });

  it("səhv parolu rədd edir", async () => {
    const stored = await hashPassword("Luxe-2026-Test!");
    expect(await verifyPassword("luxe-2026-test!", stored)).toBe(false);
  });

  it("eyni parol üçün fərqli hash verir (duz işləyir)", async () => {
    const first = await hashPassword("eyni-parol");
    const second = await hashPassword("eyni-parol");
    expect(first).not.toBe(second);
  });

  it("Cloudflare Workers-in PBKDF2 limitini aşmayan hash yaradır", async () => {
    const stored = await hashPassword("Luxe-2026-Test!");
    const iterations = Number.parseInt(stored.split("$")[2], 10);

    // Production Workers Web Crypto 100 000-dən çox PBKDF2 iterasiyasını rədd edir.
    expect(iterations).toBeLessThanOrEqual(100_000);
  });

  it("formatı pozulmuş dəyəri rədd edir, çökmür", async () => {
    expect(await verifyPassword("nə olursa olsun", "zibil")).toBe(false);
    expect(await verifyPassword("nə olursa olsun", "")).toBe(false);
  });

  it("köhnə iterasiya sayını yenidən hash tələb edən kimi tanıyır", async () => {
    expect(needsRehash("pbkdf2$sha256$1000$c2FsdA$aGFzaA")).toBe(true);
    expect(needsRehash(await hashPassword("cari"))).toBe(false);
  });
});
