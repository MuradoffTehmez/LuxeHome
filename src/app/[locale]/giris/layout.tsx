import { getMessages } from "next-intl/server";
import { ExtendedMessagesProvider } from "@/app/[locale]/(account)/extended-messages-provider";
import { ACCOUNT_CLIENT_MESSAGE_PATHS, pickMessages } from "@/i18n/client-messages";

/**
 * Əməkdaş girişi (parol → 2FA). Formalar `auth` kataloqunu client-də oxuyur, kök provider
 * isə onu ictimai səhifələrə göndərmir (#183) — burada əlavə olunur.
 */
export default async function StaffLoginLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const extra = pickMessages(await getMessages(), ACCOUNT_CLIENT_MESSAGE_PATHS);
  return <ExtendedMessagesProvider extra={extra}>{children}</ExtendedMessagesProvider>;
}
