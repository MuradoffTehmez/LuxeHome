import { describe, expect, it } from "vitest";
import { D1_MAX_BOUND_PARAMS, chunkForD1, findManyInChunks } from "@/lib/d1-chunks";

describe("D1 IN siyahısının bölünməsi (#85)", () => {
  it("hər hissə əlavə parametrlərlə birlikdə 100-dən az qalır", () => {
    const ids = Array.from({ length: 1_000 }, (_, index) => `id-${index}`);
    const chunks = chunkForD1(ids, 3);
    expect(chunks.flat()).toHaveLength(1_000);
    for (const chunk of chunks) expect(chunk.length + 3).toBeLessThan(D1_MAX_BOUND_PARAMS);
  });

  it("təkrarları atır və boş siyahıda sorğu atmır", async () => {
    expect(chunkForD1(["a", "a", "b"], 0)).toEqual([["a", "b"]]);
    const calls: string[][] = [];
    await expect(findManyInChunks([], 3, async (chunk) => (calls.push(chunk), []))).resolves.toEqual([]);
    expect(calls).toHaveLength(0);
  });

  it("hissələrin nəticələrini birləşdirir", async () => {
    const ids = Array.from({ length: 200 }, (_, index) => index);
    const result = await findManyInChunks(ids, 3, async (chunk) => chunk.map((value) => value * 2));
    expect(result).toHaveLength(200);
    expect(result.at(-1)).toBe(398);
  });
});
