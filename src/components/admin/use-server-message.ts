"use client";

import { useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { parseServerMessage } from "@/lib/admin/server-message";

/**
 * Server action-dan gələn mesajı panel dilində göstərir (#89).
 *
 * `msg()` markeri tərcümə olunur, adi mətn (məs. kabinet action-ının artıq
 * lokallaşdırılmış mesajı) olduğu kimi qaytarılır.
 */
export function useServerMessage() {
  const t = useTranslations("admin");
  return useCallback(
    (text: string | undefined): string | undefined => {
      const parsed = parseServerMessage(text);
      if (!parsed) return text;
      return t(parsed.key as Parameters<typeof t>[0], parsed.values);
    },
    [t],
  );
}

/**
 * `ActionState`-in mesajını və sahə xətalarını bir dəfə tərcümə edir — forma
 * çərçivəsi (`AdminForm`) kontekstə artıq lokallaşdırılmış state verir.
 */
export function useLocalizedActionState<T extends { message?: string; fieldErrors?: Record<string, string> }>(state: T): T {
  const translate = useServerMessage();
  return useMemo(() => {
    if (!state.message && !state.fieldErrors) return state;
    return {
      ...state,
      message: translate(state.message),
      fieldErrors: state.fieldErrors
        ? Object.fromEntries(Object.entries(state.fieldErrors).map(([key, value]) => [key, translate(value) ?? value]))
        : state.fieldErrors,
    };
  }, [state, translate]);
}
