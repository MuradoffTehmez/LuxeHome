"use client";

import { useMemo } from "react";
import { NextIntlClientProvider, useLocale, useMessages, useTimeZone } from "next-intl";
import { formats } from "@/i18n/formats";

/**
 * Root provider-in mesajlarına əlavə namespace qoşur (#81).
 *
 * Birləşmə client-də aparılır: ictimai kataloqlar (~67 KB) root provider-də artıq
 * var, server tərəfdə yenidən ötürülsəydi `(site)`-dan kabinetə hər keçiddə RSC
 * payload-ına təkrar düşərdi. Serverdən yalnız əlavə hissə gəlir.
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
  const merged = useMemo(() => ({ ...messages, ...extra }), [messages, extra]);

  return (
    <NextIntlClientProvider locale={locale} timeZone={timeZone} formats={formats} messages={merged}>
      {children}
    </NextIntlClientProvider>
  );
}
