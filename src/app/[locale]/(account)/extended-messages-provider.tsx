"use client";

import { useMemo } from "react";
import { NextIntlClientProvider, useLocale, useMessages, useTimeZone } from "next-intl";
import { formats } from "@/i18n/formats";

type Messages = Record<string, unknown>;

/** Dərin birləşmə: `{ phase2: { reservation } }` kökdəki `phase2.wizard`-ı silməməlidir (#183). */
function mergeMessages(base: Messages, extra: Messages): Messages {
  const merged: Messages = { ...base };
  for (const [key, value] of Object.entries(extra)) {
    const current = merged[key];
    merged[key] =
      current && typeof current === "object" && value && typeof value === "object"
        ? mergeMessages(current as Messages, value as Messages)
        : value;
  }
  return merged;
}

/**
 * Root provider-in mesajlarına əlavə namespace qoşur (#81).
 *
 * Birləşmə client-də aparılır: ictimai mesajlar root provider-də artıq var, server
 * tərəfdə yenidən ötürülsəydi `(site)`-dan kabinetə hər keçiddə RSC payload-ına
 * təkrar düşərdi. Serverdən yalnız əlavə hissə gəlir (hesab kataloqu, #183).
 *
 * `formats` və saat qurşağı root konfiqurasiyası ilə eyni saxlanılır — iç-içə
 * provider onları valideyndən miras almır.
 */
export function ExtendedMessagesProvider({
  extra,
  children,
}: {
  extra: Record<string, unknown>;
  children: React.ReactNode;
}) {
  const messages = useMessages();
  const locale = useLocale();
  const timeZone = useTimeZone();
  const merged = useMemo(() => mergeMessages(messages as Messages, extra), [messages, extra]);

  return (
    <NextIntlClientProvider locale={locale} timeZone={timeZone} formats={formats} messages={merged}>
      {children}
    </NextIntlClientProvider>
  );
}
