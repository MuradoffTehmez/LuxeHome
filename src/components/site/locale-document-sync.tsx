"use client";

import { useLayoutEffect } from "react";
import type { Locale } from "@/lib/constants";

/**
 * Root layout locale seqmentindən kənarda olduğuna görə statik alt route-larda
 * Next.js ilkin `lang` dəyərini keşləyə bilər. Naviqasiya zamanı sənəd dilini
 * cari route ilə sinxron saxlayır.
 */
export function LocaleDocumentSync({ locale }: { locale: Locale }) {
  useLayoutEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
