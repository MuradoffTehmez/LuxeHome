import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Prisma klienti sorğu başına yaradılır (#95): paylaşılan klientin daxili
 * promise-i yarımçıq kəsilmiş sorğuda ilişəndə sonrakı bütün sorğular workerd
 * tərəfindən «hung» kimi 500-ə çevrilirdi.
 */
const context = vi.hoisted(() => ({ current: { env: { DB: {} }, ctx: undefined as object | undefined } }));
const created = vi.hoisted(() => ({ count: 0 }));

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: () => context.current,
}));

vi.mock("@prisma/adapter-d1", () => ({
  PrismaD1: class {
    constructor(readonly db: unknown) {}
  },
}));

vi.mock("@prisma/client/wasm.js", () => ({
  PrismaClient: class {
    readonly id: number;
    constructor() {
      created.count += 1;
      this.id = created.count;
    }
    whoAmI() {
      return this.id;
    }
  },
}));

async function clientId(): Promise<number> {
  const { prisma } = await import("../prisma");
  return (prisma as unknown as { whoAmI(): number }).whoAmI();
}

describe("prisma — sorğu başına klient", () => {
  beforeEach(() => {
    context.current = { env: { DB: {} }, ctx: undefined };
  });

  it("eyni sorğu kontekstində eyni klienti qaytarır", async () => {
    context.current.ctx = {};
    expect(await clientId()).toBe(await clientId());
  });

  it("fərqli sorğular klienti paylaşmır", async () => {
    context.current.ctx = {};
    const first = await clientId();
    context.current = { env: { DB: {} }, ctx: {} };
    const second = await clientId();
    expect(second).not.toBe(first);
  });

  it("kontekstsiz çağırış (skript, test) tək klientdən istifadə edir", async () => {
    expect(await clientId()).toBe(await clientId());
  });
});
