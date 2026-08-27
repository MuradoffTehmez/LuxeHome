-- OpenNext App Router on-demand revalidation (`revalidateTag`/`revalidatePath`).
-- Eyni D1 bazası Wrangler-də `NEXT_TAG_CACHE_D1` adı ilə ikinci dəfə bağlanır.
CREATE TABLE IF NOT EXISTS "revalidations" (
  "tag" TEXT NOT NULL,
  "revalidatedAt" INTEGER NOT NULL,
  "stale" INTEGER,
  "expire" INTEGER DEFAULT NULL,
  UNIQUE("tag") ON CONFLICT REPLACE
);
