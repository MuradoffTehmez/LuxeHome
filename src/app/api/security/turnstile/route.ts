import { NextResponse } from "next/server";
import { runtimeEnv } from "@/lib/runtime-env";

export const dynamic = "force-dynamic";

export async function GET() {
  const siteKey = runtimeEnv("TURNSTILE_SITE_KEY");
  return NextResponse.json(
    siteKey ? { siteKey } : { siteKey: null },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
