import { getLocale, getMessages } from "next-intl/server";
import { loadAdminMessages, pickSharedAdminMessages, resolveAdminLocale } from "@/i18n/admin";
import { ACCOUNT_CLIENT_MESSAGE_PATHS, pickMessages } from "@/i18n/client-messages";
import { ExtendedMessagesProvider } from "./extended-messages-provider";

/**
 * Kabinet ağacına ortaq admin komponentlərinin mesajlarını verir (#81). Dil
 * URL-dəki locale-dir — kabinet ictimai saytın bir hissəsidir, `User.locale`
 * yalnız panel üçündür. Client-ə yalnız `admin` alt-dəsti (~3 KB) göndərilir.
 *
 * Hesab kataloqları (`account`, `auth`) da buradan gəlir: kök provider onları ictimai
 * səhifələrə göndərmir (#183).
 */
export async function AdminSharedMessages({ children }: { children: React.ReactNode }) {
  const locale = resolveAdminLocale(await getLocale());
  const [{ admin }, messages] = await Promise.all([loadAdminMessages(locale), getMessages()]);
  const extra = { ...pickMessages(messages, ACCOUNT_CLIENT_MESSAGE_PATHS), admin: pickSharedAdminMessages(admin) };

  return <ExtendedMessagesProvider extra={extra}>{children}</ExtendedMessagesProvider>;
}
