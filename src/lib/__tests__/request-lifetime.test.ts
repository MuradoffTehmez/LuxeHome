import { describe, expect, it } from "vitest";
import { registerRequestCleanup, trackRequestLifetime } from "@/lib/request-lifetime";

/** Əsl `ExecutionContext`-in əvəzi: `waitUntil`-ə verilən promise-ləri toplayır. */
function fakeContext() {
  const waited: Promise<unknown>[] = [];
  const ctx = {
    waitUntil(promise: Promise<unknown>) {
      waited.push(promise);
    },
    passThroughOnException(this: unknown) {
      if (this !== ctx) throw new TypeError("Illegal invocation");
    },
  } as unknown as ExecutionContext;
  return { ctx, waited, drain: async () => { for (let i = 0; i < waited.length; i += 1) await waited[i]; } };
}

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => (resolve = done));
  return { promise, resolve };
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("trackRequestLifetime", () => {
  it("sarğısız ctx-də qeydiyyat heç nə etmir", () => {
    expect(registerRequestCleanup({ waitUntil: () => undefined }, () => undefined)).toBe(false);
    expect(registerRequestCleanup(undefined, () => undefined)).toBe(false);
  });

  it("təmizləmə cavab gövdəsi oxunandan sonra işləyir", async () => {
    const { ctx, drain } = fakeContext();
    const lifetime = trackRequestLifetime(ctx);
    let cleaned = 0;
    expect(registerRequestCleanup(lifetime.ctx, () => (cleaned += 1))).toBe(true);

    const response = lifetime.finish(new Response("salam"));
    await tick();
    expect(cleaned).toBe(0);
    expect(await response.text()).toBe("salam");
    await drain();
    expect(cleaned).toBe(1);
  });

  it("klient bağlantını kəsəndə (gövdə ləğv olunanda) da işləyir", async () => {
    const { ctx, drain } = fakeContext();
    const lifetime = trackRequestLifetime(ctx);
    let cleaned = false;
    registerRequestCleanup(lifetime.ctx, () => (cleaned = true));
    const body = new ReadableStream({ pull: () => new Promise(() => undefined) });
    const response = lifetime.finish(new Response(body));
    await response.body?.cancel();
    await drain();
    expect(cleaned).toBe(true);
  });

  it("bütün fon işlərini, o cümlədən sonradan açılanı, gözləyir", async () => {
    const { ctx, drain } = fakeContext();
    const lifetime = trackRequestLifetime(ctx);
    const first = deferred();
    const second = deferred();
    let cleaned = false;
    registerRequestCleanup(lifetime.ctx, () => (cleaned = true));
    lifetime.ctx.waitUntil(first.promise.then(() => lifetime.ctx.waitUntil(second.promise)));
    lifetime.finish(null);

    const settled = drain();
    first.resolve();
    await tick();
    expect(cleaned).toBe(false);
    second.resolve();
    await settled;
    await drain();
    expect(cleaned).toBe(true);
  });

  it("rədd olunan fon işi və yıxılan təmizləmə digərlərini saxlamır", async () => {
    const { ctx, drain } = fakeContext();
    const lifetime = trackRequestLifetime(ctx);
    const calls: string[] = [];
    registerRequestCleanup(lifetime.ctx, () => {
      calls.push("a");
      throw new Error("x");
    });
    registerRequestCleanup(lifetime.ctx, () => calls.push("b"));
    lifetime.ctx.waitUntil(Promise.reject(new Error("fon")));
    lifetime.finish(null);
    await drain().catch(() => undefined);
    await tick();
    expect(calls).toEqual(["a", "b"]);
  });

  it("qalan metodları əsl ctx-ə bağlı ötürür", () => {
    const { ctx } = fakeContext();
    const lifetime = trackRequestLifetime(ctx);
    expect(() => lifetime.ctx.passThroughOnException()).not.toThrow();
  });
});
