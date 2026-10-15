/**
 * Klientə (`NextIntlClientProvider`) gedən mesajlar (#183).
 *
 * Kataloq hər səhifənin HTML-inə (RSC payload) yazılır. Əvvəllər kök layout bütün ictimai
 * kataloqu (~99 KB, AZ) göndərirdi, halbuki server komponentləri mesajları request
 * konfiqurasiyasından oxuyur və klientə ehtiyac duymur. Burada yalnız client tərəfdə
 * `useTranslations("…")` ilə oxunan yollar qalır.
 *
 * Siyahını `client-messages.test.ts` mənbədən yoxlayır: yeni komponent siyahıda olmayan
 * namespace işlədərsə test yıxılır. Yol tam alt ağacı daxil edir (`"property"` → bütün
 * `property.*`).
 */

/** Kök provider — hər ictimai səhifə. */
export const PUBLIC_CLIENT_MESSAGE_PATHS = [
  "common.analytics",
  "common.globalError",
  "common.locale",
  "common.notFound",
  "common.theme",
  "common.ui",
  "contact",
  "content",
  "knowledge",
  "legal",
  "listings.agencyDirectory",
  "listings.agencyProfile",
  "listings.search",
  "navigation",
  "partners",
  "phase2.neighborhood",
  "phase2.wizard",
  "phase3.investor.calculator",
  "phase3.units",
  "property",
  "seoLandings",
  // Navbar-dakı hesab menyusu (`account-menu.tsx`) — `auth`-un qalanı ictimai səhifəyə getmir.
  "auth.adminPanel",
  "auth.login",
  "auth.myAccount",
  "auth.notifications",
  "auth.notificationsUnread",
  "auth.register",
] as const;

/**
 * Hesab ağacları (`(account)`, `giris`) — kabinet və giriş formaları. Kök provider-in
 * üzərinə `ExtendedMessagesProvider` ilə əlavə olunur.
 */
export const ACCOUNT_CLIENT_MESSAGE_PATHS = ["account", "auth", "phase2.reservation"] as const;

type Messages = Record<string, unknown>;

/** Kataloqdan yalnız verilmiş yolları saxlayır (iç-içə forma qorunur, olmayan yol atılır). */
export function pickMessages(messages: Messages, paths: readonly string[]): Messages {
  const picked: Messages = {};
  for (const path of paths) {
    const keys = path.split(".");
    let source: unknown = messages;
    for (const key of keys) source = (source as Messages | undefined)?.[key];
    if (source === undefined) continue;
    let target = picked;
    for (const key of keys.slice(0, -1)) {
      const next = target[key];
      target = (next && typeof next === "object" ? next : (target[key] = {})) as Messages;
    }
    target[keys[keys.length - 1]] = source;
  }
  return picked;
}
