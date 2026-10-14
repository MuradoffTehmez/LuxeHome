import { NextResponse } from "next/server";
import { timingSafeEqual } from "@/lib/auth/crypto";
import { internalCronToken } from "@/lib/cron-auth";
import { runtimeEnv } from "@/lib/runtime-env";
import { escalateStaleLeads, refreshResponseStats } from "@/lib/accounts/lead-jobs";

/**
 * Müraciət işləri (#161): `?is=escalate` — 30 dəqiqə cavabsız agentlik müraciətini sahibə
 * bildirir; `?is=response-stats` — «Tez cavab verir» göstəricilərini yenidən hesablayır.
 *
 * `worker.ts`-dəki `scheduled()` handler-i (Cloudflare cron trigger, `wrangler.jsonc`) bu
 * marşrutu özü çağırır. Açar `CRON_SECRET` və ya `AUTH_SECRET`-dən törədilən daxili açardır;
 * açarsız sorğu 404 alır (marşrutun varlığı bildirilmir).
 */

export const dynamic = "force-dynamic";

async function isAuthorized(request: Request): Promise<boolean> {
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return false;
  const given = new TextEncoder().encode(header.slice("Bearer ".length));
  const expected: string[] = [];
  const cronSecret = runtimeEnv("CRON_SECRET");
  if (cronSecret) expected.push(cronSecret);
  const authSecret = runtimeEnv("AUTH_SECRET");
  if (authSecret) expected.push(await internalCronToken(authSecret));
  return expected.some((value) => timingSafeEqual(given, new TextEncoder().encode(value)));
}

export async function POST(request: Request) {
  if (!(await isAuthorized(request))) return new NextResponse(null, { status: 404 });

  const job = new URL(request.url).searchParams.get("is");
  try {
    if (job === "escalate") return NextResponse.json(await escalateStaleLeads());
    if (job === "response-stats") return NextResponse.json(await refreshResponseStats());
    return NextResponse.json({ error: "unknown_job" }, { status: 400 });
  } catch (error) {
    console.error(`[cron] «${job}» işi alınmadı:`, error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
