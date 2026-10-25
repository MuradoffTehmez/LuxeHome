import { indexNowEnabled, indexNowKey } from "@/lib/indexnow";

// Açar sorğu vaxtı `AUTH_SECRET`-dən hesablanır; build-də prerender 404-ü dondurardı.
export const dynamic = "force-dynamic";

/**
 * IndexNow açar faylı (#289): axtarış sistemi göndərişin bu saytdan gəldiyini
 * `keyLocation` ünvanındakı açarla təsdiqləyir. Staging-də açar verilmir.
 */
export async function GET() {
  if (!indexNowEnabled()) return new Response("Not found", { status: 404 });
  return new Response(await indexNowKey(process.env.AUTH_SECRET ?? ""), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
