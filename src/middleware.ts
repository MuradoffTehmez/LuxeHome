import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { isStaging } from "@/config/site";
import { getCanonicalHostRedirect } from "@/lib/seo-host";
import { localeFromPathname } from "@/i18n/path-locale";
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

const intlMiddleware = createIntlMiddleware(routing);

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

/**
 * Sessiya/hesab yollarının siyahısı — bunlar qəsdən dil prefiksindən kənardadır
 * (`session-routing.ts` yönləndirmə hədəfləri də sərt bu yollara bağlıdır), ona görə
 * next-intl middleware-i bu yollarda işə düşmür.
 */
function isAccountFlowRoute(pathname: string): boolean {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/giris" ||
    pathname.startsWith("/giris/") ||
    pathname === "/kabinet" ||
    pathname.startsWith("/kabinet/") ||
    pathname === "/daxil-ol" ||
    pathname.startsWith("/daxil-ol/") ||
    pathname === "/qeydiyyat" ||
    pathname.startsWith("/qeydiyyat/")
  );
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const forwardedProtocol = request.headers.get("x-forwarded-proto");
  const canonicalRedirect = getCanonicalHostRedirect({
    hostname: request.nextUrl.hostname,
    protocol: forwardedProtocol ? `${forwardedProtocol}:` : request.nextUrl.protocol,
    pathname,
    search,
    isProduction: process.env.NODE_ENV === "production",
    isStaging: isStaging(),
  });
  if (canonicalRedirect) return NextResponse.redirect(canonicalRedirect, 308);

  if (!isAccountFlowRoute(pathname)) {
    const response = intlMiddleware(request);
    response.headers.set("Content-Language", localeFromPathname(pathname));
    if (isStaging()) response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

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
  // `api`, `_next`, `media` (R2 şəkil route-u) və uzantılı fayllar middleware-dən keçmir
  matcher: ["/((?!api|_next|media|llms\\.txt|.*\\..*).*)"],
};
