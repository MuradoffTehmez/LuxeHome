import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { trackRequestLifetime } from "@/lib/request-lifetime";

/**
 * Sorğu başına Prisma klientinin wasm yaddaşı (#270).
 *
 * Hər klient izolyatın ortaq wasm yaddaşında öz query engine-ini qurur (~1,6 MB) və workerd o
 * yaddaşı `$disconnect()`-siz geri vermir: lokal stack-də yüzlərlə sorğudan sonra yaddaş GB-larla
 * böyüyür və D1-ə toxunan bütün marşrutlar 500 verirdi. Bu test `worker.ts`-in sorğu ömrünü təqlid
 * edir və 60 ardıcıl sorğuda yaddaşın böyümədiyini yoxlayır (sızma ~100 MB verərdi).
 *
 * Yaddaşı görmək üçün Prisma-nın wasm instansı tutulur — ona görə `@/lib/prisma` dinamik idxal
 * olunur (patch-dən sonra).
 */
const memories: WebAssembly.Memory[] = [];
const OriginalInstance = WebAssembly.Instance;
WebAssembly.Instance = function (module: WebAssembly.Module, imports?: WebAssembly.Imports) {
  const instance = new OriginalInstance(module, imports);
  for (const value of Object.values(instance.exports)) {
    if (value instanceof WebAssembly.Memory) memories.push(value);
  }
  return instance;
} as unknown as typeof WebAssembly.Instance;

const CONTEXT = Symbol.for("__cloudflare-context__");
const REQUESTS = 60;

async function simulateRequest(query: () => Promise<unknown>): Promise<void> {
  const waited: Promise<unknown>[] = [];
  const lifetime = trackRequestLifetime({ waitUntil: (promise: Promise<unknown>) => waited.push(promise) } as unknown as ExecutionContext);
  (globalThis as Record<symbol, unknown>)[CONTEXT] = { env, cf: undefined, ctx: lifetime.ctx };
  await query();
  lifetime.finish(null);
  for (let index = 0; index < waited.length; index += 1) await waited[index];
}

describe("sorğu başına Prisma klienti", () => {
  it("sorğu bitəndə bağlanır — wasm yaddaşı sorğu sayı ilə böyümür", async () => {
    const { prisma } = await import("@/lib/prisma");
    await simulateRequest(() => prisma.setting.findMany({ take: 1 }));
    expect(memories, "Prisma wasm instansı tutulmadı — test heç nəyi yoxlamır").toHaveLength(1);
    const baseline = memories[0].buffer.byteLength;

    for (let index = 0; index < REQUESTS; index += 1) {
      await simulateRequest(() => prisma.setting.findMany({ take: 1 }));
    }
    const grownMb = (memories[0].buffer.byteLength - baseline) / 1048576;
    expect(grownMb).toBeLessThan(8);
  }, 120_000);
});
