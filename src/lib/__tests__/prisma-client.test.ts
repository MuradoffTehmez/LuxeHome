import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Prisma klienti sorğu başına yaradılır (#95): paylaşılan klientin daxili
 * promise-i yarımçıq kəsilmiş sorğuda ilişəndə sonrakı bütün sorğular workerd
 * tərəfindən «hung» kimi 500-ə çevrilirdi.
 */
const context = vi.hoisted(() => ({ current: { env: { DB: {} }, ctx: undefined as object | undefined } }));
const created = vi.hoisted(() => ({ count: 0 }));
const extensions = vi.hoisted(() => ({ last: undefined as unknown }));

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
    // Yavaş sorğu jurnalı (#173) klienti `$extends` ilə sarır — mock eyni obyekti qaytarır
    // və genişlənməni yoxlamaq üçün saxlayır.
    $extends(extension: unknown) {
      extensions.last = extension;
      return this;
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

  it("200 ms-dən uzun sorğunu parametrsiz jurnala yazır (#173)", async () => {
    context.current.ctx = {};
    await clientId();
    const { query } = extensions.last as {
      query: { $allOperations(input: { model?: string; operation: string; args: unknown; query: (args: unknown) => Promise<unknown> }): Promise<unknown> };
    };
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const now = vi.spyOn(Date, "now");
    try {
      now.mockReturnValueOnce(1_000).mockReturnValueOnce(1_250);
      await query.$allOperations({ model: "Property", operation: "findMany", args: { where: { phone: "secret" } }, query: async () => [] });
      now.mockReturnValueOnce(2_000).mockReturnValueOnce(2_050);
      await query.$allOperations({ model: "Setting", operation: "findUnique", args: {}, query: async () => null });
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith("[db] yavaş sorğu Property.findMany 250 ms");
    } finally {
      warn.mockRestore();
      now.mockRestore();
    }
  });
});
