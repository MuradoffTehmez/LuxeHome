import { NextResponse } from "next/server";
import { AUTH_KINDS } from "@/lib/constants";
import { getOptionalUser } from "@/lib/auth/guard";
import { isPublicApiBlocked, maintenanceApiResponse } from "@/lib/system-mode";

export const dynamic = "force-dynamic";

/**
 * Daxil olmuş ictimai istifadəçinin öz ad və e-poçtu — elan detalındakı rezervasiya formasını
 * əvvəlcədən doldurmaq üçün (#177). Əvvəllər səhifə bunu render-də oxuyurdu və buna görə
 * kənar keşə düşə bilmirdi. Yalnız sessiya sahibinin öz məlumatı qayıdır; cavab heç vaxt
 * keşlənmir (paylaşılan keşdə başqasının e-poçtu görünə bilərdi).
 */
export async function GET() {
  if (await isPublicApiBlocked()) return maintenanceApiResponse();

  const user = await getOptionalUser(AUTH_KINDS.PUBLIC);
  const body = user ? { signedIn: true as const, name: user.name, email: user.email } : { signedIn: false as const };
  return NextResponse.json(body, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
