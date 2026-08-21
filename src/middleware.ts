import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import {
  SESSION_COOKIE,
  SESSION_SUBJECT,
  TOKEN_ISSUER,
} from "@/lib/auth/cookie-names";

/**
 * İdarə paneli qapısı və ucuz sessiya yoxlaması.
 *
 * Burada yalnız cookie imzası doğrulanır — D1-ə müraciət edilmir, çünki middleware
 * hər sorğuda işləyir. Sessiyanın həqiqətən diri olduğunu (ləğv edilməyib, istifadəçi
 * aktivdir) `admin/layout.tsx` və hər server action-ın başındakı guard yoxlayır.
 *
 * Panel bağlıdırsa (`ADMIN_ENABLED !== "true"`) hər iki marşrut 404 qaytarır —
 * panelin varlığı kənara bildirilmir.
 */

async function hasValidSignature(token: string | undefined): Promise<boolean> {
  if (!token || !process.env.AUTH_SECRET) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET), {
      issuer: TOKEN_ISSUER,
      subject: SESSION_SUBJECT,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Panel və giriş səhifələri üçün sərt başlıqlar.
 *
 * `frame-ancestors 'none'` clickjacking-i bağlayır: oğurlanmış sessiya ilə panelin
 * kənar saytda görünməz iframe-də açılıb kliklərin oğurlanması mümkün olmamalıdır.
 * `form-action 'self'` isə forma göndərilişini kənar ünvana yönləndirməyə imkan vermir.
 *
 * `script-src` qəsdən `'unsafe-inline'` saxlayır — Next.js hidrasiya məlumatını inline
 * skript kimi yerləşdirir və nonce axını App Router-də hələ tam dəstəklənmir.
 */
const ADMIN_CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://images.unsplash.com https://media.luxehomeestate.az",
  "font-src 'self' data:",
  "connect-src 'self'",
].join("; ");

function harden(response: NextResponse): NextResponse {
  response.headers.set("Content-Security-Policy", ADMIN_CSP);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  );
  // Panel səhifələri heç vaxt paylaşılan keşdə saxlanılmamalıdır
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

export async function middleware(request: NextRequest) {
  if (process.env.ADMIN_ENABLED !== "true") {
    return NextResponse.rewrite(new URL("/__baglidir", request.url));
  }

  const signedIn = await hasValidSignature(request.cookies.get(SESSION_COOKIE)?.value);
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/admin") && !signedIn) {
    const target = new URL("/giris", request.url);
    target.searchParams.set("davam", `${pathname}${search}`);
    return NextResponse.redirect(target);
  }

  if (pathname === "/giris" && signedIn) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // Layout cari marşrutu bilməlidir: müvəqqəti parolla gələn istifadəçi hesab
  // səhifəsinə yönləndirilir, amma elə həmin səhifədə təkrar yönləndirilməməlidir.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  return harden(NextResponse.next({ request: { headers: requestHeaders } }));
}

export const config = {
  matcher: ["/admin/:path*", "/admin", "/giris/:path*", "/giris"],
};
