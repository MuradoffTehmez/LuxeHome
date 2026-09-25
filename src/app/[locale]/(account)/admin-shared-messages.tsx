import { getLocale } from "next-intl/server";
import { loadAdminMessages, pickSharedAdminMessages, resolveAdminLocale } from "@/i18n/admin";
import { ExtendedMessagesProvider } from "./extended-messages-provider";

/**
 * Kabinet ağacına ortaq admin komponentlərinin mesajlarını verir (#81). Dil
 * URL-dəki locale-dir — kabinet ictimai saytın bir hissəsidir, `User.locale`
 * yalnız panel üçündür. Client-ə yalnız `admin` alt-dəsti (~3 KB) göndərilir.
 */
export async function AdminSharedMessages({ children }: { children: React.ReactNode }) {
  const locale = resolveAdminLocale(await getLocale());
  const { admin } = await loadAdminMessages(locale);

  return <ExtendedMessagesProvider extra={{ admin: pickSharedAdminMessages(admin) }}>{children}</ExtendedMessagesProvider>;
}
