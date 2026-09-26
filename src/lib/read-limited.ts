/**
 * Kənar HTTP cavabını ölçü limiti ilə oxuyur (#103 CSV idxalı). `Content-Length` olmaya
 * və ya yalan ola bilər, ona görə limit axın oxunarkən yoxlanır.
 */
export async function readLimited(response: Response, limit: number): Promise<ArrayBuffer | null> {
  const reader = response.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged.buffer;
}

