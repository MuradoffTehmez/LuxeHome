import { cache } from "react";

import {
  createAdminTranslator,
  loadAdminMessages,
  resolveAdminLocale,
  type AdminMessages,
} from "@/i18n/admin";
import { AUTH_KINDS, type Locale } from "@/lib/constants";
import { getOptionalUser, requireStaff } from "@/lib/auth/guard";

type AdminI18n = {
  locale: Locale;
  messages: AdminMessages;
  t: ReturnType<typeof createAdminTranslator>;
};

/**
 * Panel səhifələrinin tərcümə girişi.
 *
 * `cache()` sayəsində layout və səhifə eyni sorğuda çağırsa da sessiya bir dəfə
 * oxunur. Dil `User.locale`-dandır — `/admin` locale prefiksi daşımır, ona görə
 * URL-dən oxumaq mümkün deyil.
 */
export const getAdminI18n = cache(async (): Promise<AdminI18n> => {
  const user = await requireStaff();
  const locale = resolveAdminLocale(user.locale);
  const messages = await loadAdminMessages(locale);

  return { locale, messages, t: createAdminTranslator(locale, messages) };
});

/** Qısa forma — səhifələrin əksəriyyətinə yalnız tərcüməçi lazımdır. */
export async function getAdminT() {
  return (await getAdminI18n()).t;
}

/**
 * `generateMetadata` üçün variant: sessiya yoxdursa yönləndirmir, sadəcə default
 * dilə düşür. `requireStaff()` metadata mərhələsində `redirect()` atsa, səhifənin
 * öz qoruması işə düşməmiş sorğu kəsilərdi.
 */
export const getAdminMetadataT = cache(async () => {
  const user = await getOptionalUser(AUTH_KINDS.STAFF_2FA);
  const locale = resolveAdminLocale(user?.locale);
  const messages = await loadAdminMessages(locale);

  return createAdminTranslator(locale, messages);
});
