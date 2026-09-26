import { describe, expect, it } from "vitest";
import { readLimited } from "@/lib/read-limited";

function chunked(sizes: number[]): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const size of sizes) controller.enqueue(new Uint8Array(size).fill(7));
      controller.close();
    },
  });
  return new Response(stream);
}

describe("readLimited", () => {
  it("limit daxilində bütün hissələri birləşdirir", async () => {
    const buffer = await readLimited(chunked([3, 4, 5]), 12);
    expect(buffer?.byteLength).toBe(12);
  });

  it("Content-Length olmadan da limiti aşan axını kəsir", async () => {
    await expect(readLimited(chunked([8, 8]), 10)).resolves.toBeNull();
  });
});
