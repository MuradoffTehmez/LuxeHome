import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { loadAdminMessages, pickSharedAdminMessages, resolveAdminLocale } from "@/i18n/admin";

/**
 * Kabinet ağacına ictimai mesajlarla yanaşı ortaq admin komponentlərinin
 * mesajlarını da verir (#81). Dil URL-dəki locale-dir — kabinet ictimai saytın
 * bir hissəsidir, `User.locale` yalnız panel üçündür.
 */
export async function AdminSharedMessages({ children }: { children: React.ReactNode }) {
  const locale = resolveAdminLocale(await getLocale());
  const [messages, adminMessages] = await Promise.all([getMessages(), loadAdminMessages(locale)]);

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={{ ...messages, admin: pickSharedAdminMessages(adminMessages.admin) }}
    >
      {children}
    </NextIntlClientProvider>
  );
}
