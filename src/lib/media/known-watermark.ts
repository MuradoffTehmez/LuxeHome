import { prisma } from "@/lib/prisma";

/**
 * Bu SHA-256 izi sistemin öz nişanlı master faylına aiddirmi?
 *
 * `Media.checksum` nişan çəkildikdən **sonrakı** master baytlarının izidir.
 * Saytdan olduğu kimi endirilib yenidən yüklənən fayl eyni izi daşıyır və
 * ikinci dəfə nişanlanmır.
 */
export async function isKnownWatermarkedChecksum(checksum: string): Promise<boolean> {
  const existing = await prisma.media.findFirst({
    where: { checksum, watermarkApplied: true },
    select: { id: true },
  });
  return Boolean(existing);
}
