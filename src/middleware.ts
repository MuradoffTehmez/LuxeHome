import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import {
  SESSION_COOKIE,
  SESSION_SUBJECT,
  TOKEN_ISSUER,
} from "@/lib/auth/cookie-names";
import {
  isUsableSignedSession,
  signedSessionRedirect,
  type SignedSession,
} from "@/lib/auth/session-routing";

/**
 * İdarə paneli və kabinet qapısı, ucuz sessiya yoxlaması.
 *
 * Burada yalnız cookie imzası doğrulanır — D1-ə müraciət edilmir, çünki middleware
 * hər sorğuda işləyir. Sessiyanın həqiqətən diri olduğunu (ləğv edilməyib, istifadəçi
 * aktivdir) `admin/layout.tsx` və hər server action-ın başındakı guard yoxlayır.
 *
 * Panel bağlıdırsa (`ADMIN_ENABLED !== "true"`) yalnız panel marşrutları 404 qaytarır —
 * panelin varlığı kənara bildirilmir.
 */

async function readSignedSession(token: string | undefined): Promise<SignedSession | null> {
  if (!token || !process.env.AUTH_SECRET) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET), {
      issuer: TOKEN_ISSUER,
      subject: SESSION_SUBJECT,
    });
    const accountType = payload.accountType;
    const authKind = payload.authKind;
    if (
      accountType !== "STAFF" &&
      accountType !== "USER" &&
      accountType !== "OWNER" &&
      accountType !== "AGENCY" ||
      (authKind !== "STAFF_2FA" && authKind !== "PUBLIC")
    ) {
      return null;
    }
    const session: SignedSession = {
      accountType: accountType as SignedSession["accountType"],
      authKind: authKind as SignedSession["authKind"],
    };
    return isUsableSignedSession(session) ? session : null;
  } catch {
    return null;
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
  const { pathname, search } = request.nextUrl;
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isStaffLoginRoute = pathname === "/giris" || pathname.startsWith("/giris/");

  if ((isAdminRoute || isStaffLoginRoute) && process.env.ADMIN_ENABLED !== "true") {
    return NextResponse.rewrite(new URL("/__baglidir", request.url));
  }

  const session = await readSignedSession(request.cookies.get(SESSION_COOKIE)?.value);
  const redirectPath = signedSessionRedirect(pathname, search, session);
  if (redirectPath) return NextResponse.redirect(new URL(redirectPath, request.url));

  // Layout cari marşrutu bilməlidir: müvəqqəti parolla gələn istifadəçi hesab
  // səhifəsinə yönləndirilir, amma elə həmin səhifədə təkrar yönləndirilməməlidir.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  return harden(NextResponse.next({ request: { headers: requestHeaders } }));
}

export const config = {
  matcher: ["/admin/:path*", "/admin", "/giris/:path*", "/giris", "/kabinet/:path*", "/kabinet"],
};
