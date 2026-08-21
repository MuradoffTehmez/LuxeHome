import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { currentSessionId, requireUser } from "@/lib/auth/guard";
import { listSessions } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/lib/constants";
import { PasswordForm } from "./password-form";
import { revokeOne, revokeOtherSessions } from "./actions";

export const metadata: Metadata = { title: "Hesabım" };

// Sessiya siyahısı hər baxışda təzə olmalıdır
export const dynamic = "force-dynamic";

/** Sessiya siyahısında cihazın kobud adı — tam user-agent sətri oxunmur. */
function deviceLabel(userAgent: string | null): string {
  if (!userAgent) return "Naməlum cihaz";
  const browser =
    /Edg\//.test(userAgent) ? "Edge"
    : /OPR\//.test(userAgent) ? "Opera"
    : /Chrome\//.test(userAgent) ? "Chrome"
    : /Safari\//.test(userAgent) ? "Safari"
    : /Firefox\//.test(userAgent) ? "Firefox"
    : "Naməlum brauzer";
  const platform =
    /Android/.test(userAgent) ? "Android"
    : /iPhone|iPad/.test(userAgent) ? "iOS"
    : /Windows/.test(userAgent) ? "Windows"
    : /Macintosh/.test(userAgent) ? "macOS"
    : /Linux/.test(userAgent) ? "Linux"
    : "";
  return platform ? `${browser} · ${platform}` : browser;
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ parol?: string }>;
}) {
  const [user, { parol }] = await Promise.all([requireUser(), searchParams]);
  const [sessions, activeSid, remainingCodes] = await Promise.all([
    listSessions(user.id),
    currentSessionId(),
    prisma.backupCode.count({ where: { userId: user.id, usedAt: null } }),
  ]);

  const otherSessions = sessions.filter((session) => session.id !== activeSid);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <header>
        <h1 className="font-display text-2xl text-ink">Hesabım</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {user.email} · {ROLE_LABELS[user.role]}
        </p>
      </header>

      <section className="rounded-xs border border-line bg-paper p-6">
        <h2 className="font-display text-lg text-ink">Parolu dəyiş</h2>
        <div className="mt-4 max-w-md">
          <PasswordForm mustChange={parol === "deyis" || user.mustChangePassword} />
        </div>
      </section>

      <section className="rounded-xs border border-line bg-paper p-6">
        <h2 className="font-display text-lg text-ink">İki mərhələli doğrulama</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Aktivdir. İşlənməmiş ehtiyat kod sayı: <strong className="text-ink">{remainingCodes}</strong>
        </p>
        {remainingCodes < 3 && (
          <p className="mt-3 rounded-xs border border-warning/30 bg-warning-bg px-4 py-3 text-sm text-ink">
            Ehtiyat kodlarınız azalıb. Yenilərini yaratmaq üçün administratora müraciət edin.
          </p>
        )}
      </section>

      <section className="rounded-xs border border-line bg-paper p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg text-ink">Aktiv sessiyalar</h2>
          {otherSessions.length > 0 && (
            <form action={revokeOtherSessions}>
              <button
                type="submit"
                className="min-h-11 cursor-pointer text-sm text-ink-soft underline-offset-4 transition-colors duration-200 hover:text-danger hover:underline"
              >
                Digər cihazların hamısını bağla
              </button>
            </form>
          )}
        </div>

        <ul className="mt-4 flex flex-col gap-3">
          {sessions.map((session) => {
            const isCurrent = session.id === activeSid;
            return (
              <li
                key={session.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3 last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink">
                    {deviceLabel(session.userAgent)}
                    {isCurrent && (
                      <span className="ml-2 rounded-full bg-success-bg px-2 py-0.5 text-xs text-success">
                        bu cihaz
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {session.ip ?? "IP yoxdur"} · son aktivlik{" "}
                    {session.lastSeenAt.toLocaleString("az-AZ")}
                  </p>
                </div>

                {!isCurrent && (
                  <form action={revokeOne}>
                    <input type="hidden" name="sid" value={session.id} />
                    <button
                      type="submit"
                      className="min-h-11 cursor-pointer text-sm text-danger underline-offset-4 transition-colors duration-200 hover:underline"
                    >
                      Bağla
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
