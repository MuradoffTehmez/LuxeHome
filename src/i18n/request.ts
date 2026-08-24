import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import { formats } from "./formats";
import { MESSAGE_NAMESPACES } from "./config";

async function loadMessages(locale: string) {
  const modules = await Promise.all(
    MESSAGE_NAMESPACES.map((namespace) =>
      import(`./locales/${locale}/${namespace}.json`).then((m) => m.default),
    ),
  );
  return Object.fromEntries(MESSAGE_NAMESPACES.map((namespace, i) => [namespace, modules[i]]));
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  const messages = await loadMessages(locale);

  return {
    locale,
    messages,
    formats,
    // Naməlum açar tətbiqi çökdürmür — konsola yazılır, AZ mənbə mətninə (default
    // dil) düşülmür, çünki naməlum açarın özü ekranda görünür və problem tez tutulur.
    onError(error) {
      console.error("[i18n]", error);
    },
    getMessageFallback({ namespace, key }) {
      return `${namespace ? `${namespace}.` : ""}${key}`;
    },
  };
});
