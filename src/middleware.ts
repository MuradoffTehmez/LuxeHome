import { NextResponse, type NextRequest } from "next/server";

/**
 * İdarə paneli qapısı.
 *
 * `/admin` və `/giris` marşrutlarında hələ autentifikasiya yoxdur, ona görə ilkin
 * ictimai yayımda hər ikisi bağlıdır və 404 qaytarır. Panel hazır olduqda
 * Cloudflare-də `ADMIN_ENABLED` dəyəri `"true"` edilir:
 *
 *   npx wrangler secret put ADMIN_ENABLED
 *
 * Mövcud olmayan marşruta rewrite edilir ki, Next-in `not-found.tsx` səhifəsi
 * 404 statusu ilə göstərilsin — panelin varlığı kənara bildirilmir.
 */
export function middleware(request: NextRequest) {
  if (process.env.ADMIN_ENABLED === "true") {
    return NextResponse.next();
  }

  return NextResponse.rewrite(new URL("/__baglidir", request.url));
}

export const config = {
  matcher: ["/admin/:path*", "/admin", "/giris/:path*", "/giris"],
};
