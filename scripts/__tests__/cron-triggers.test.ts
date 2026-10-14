import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CRON_JOBS, cronJobFor, internalCronToken } from "../../src/lib/cron-auth";

/**
 * `wrangler.jsonc` → `triggers.crons` ilə `CRON_JOBS` eyni olmalıdır (#161): biri dəyişib
 * digəri unudulsa, cron işə düşür, amma `worker.ts` onu heç bir işə bağlamır və səssizcə keçir.
 */
describe("cron cədvəli", () => {
  it("wrangler cron ifadələri CRON_JOBS ilə eynidir", () => {
    const source = readFileSync(join(process.cwd(), "wrangler.jsonc"), "utf8");
    const match = source.match(/"triggers":\s*\{\s*"crons":\s*\[([^\]]*)\]/);
    expect(match, "wrangler.jsonc-də triggers.crons tapılmadı").not.toBeNull();
    const crons = [...match![1].matchAll(/"([^"]+)"/g)].map((item) => item[1]).sort();
    expect(crons).toEqual(Object.keys(CRON_JOBS).sort());
  });

  it("naməlum ifadəyə iş vermir", () => {
    expect(cronJobFor("*/10 * * * *")).toBe("escalate");
    expect(cronJobFor("0 0 * * *")).toBeNull();
  });

  it("daxili açar sirrdən asılıdır və deterministikdir", async () => {
    const first = await internalCronToken("secret-a");
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(await internalCronToken("secret-a")).toBe(first);
    expect(await internalCronToken("secret-b")).not.toBe(first);
  });
});
