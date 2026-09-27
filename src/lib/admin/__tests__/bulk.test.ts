import { beforeEach, describe, expect, it, vi } from "vitest";
import { failure, success } from "@/lib/admin/action-state";
import { msg } from "@/lib/admin/server-message";

const effects = vi.hoisted(() => ({ requireAdminAction: vi.fn() }));

vi.mock("@/lib/admin/guard", () => ({
  AdminGuardError: class AdminGuardError extends Error {},
  requireAdminAction: effects.requireAdminAction,
}));

import { guardedBulk, runBulk } from "@/lib/admin/bulk";

function selection(ids: string[], intent: string) {
  const data = new FormData();
  for (const id of ids) data.append("ids", id);
  data.set("intent", intent);
  return data;
}

describe("toplu əməliyyatlar", () => {
  beforeEach(() => {
    effects.requireAdminAction.mockReset().mockResolvedValue({ id: "admin" });
  });

  it("təkrar id-ləri (kart + cədvəl görünüşü) bir dəfə işləyir", async () => {
    const run = vi.fn().mockResolvedValue(success("ok"));
    const result = await guardedBulk("user:manage" as never, selection(["a", "b", "a"], "delete"), { delete: run });

    expect(run).toHaveBeenCalledTimes(2);
    expect(result).toEqual(success(msg("server.bulk.tamamlandi", { p0: "2" })));
  });

  it("naməlum intent və boş seçimi rədd edir", async () => {
    const run = vi.fn();
    expect(await guardedBulk("user:manage" as never, selection(["a"], "drop"), { delete: run })).toEqual(
      failure(msg("server.bulk.namelumEmeliyyat")),
    );
    expect(await guardedBulk("user:manage" as never, selection([], "delete"), { delete: run })).toEqual(
      failure(msg("server.bulk.hecNeSecilmeyib")),
    );
    expect(run).not.toHaveBeenCalled();
  });

  it("guard keçməsə heç bir qeydə toxunmur", async () => {
    const { AdminGuardError } = await import("@/lib/admin/guard");
    effects.requireAdminAction.mockRejectedValue(new AdminGuardError("icazə yoxdur"));
    const run = vi.fn();

    const result = await guardedBulk("user:manage" as never, selection(["a"], "delete"), { delete: run });

    expect(result.status).toBe("error");
    expect(run).not.toHaveBeenCalled();
  });

  it("qismən uğuru və atılan xətanı sayır", async () => {
    const run = vi
      .fn()
      .mockResolvedValueOnce(success("ok"))
      .mockResolvedValueOnce(failure("yox"))
      .mockRejectedValueOnce(new Error("D1"));

    expect(await runBulk(["a", "b", "c"], run)).toEqual(
      success(msg("server.bulk.qismenTamamlandi", { p0: "1", p1: "3" })),
    );
  });
});
