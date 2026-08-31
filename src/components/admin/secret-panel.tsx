"use client";

import { useTranslations } from "next-intl";

import { useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Bir dəfə göstərilən dəyərin paneli.
 *
 * Müvəqqəti parol yalnız yaradıldığı anda mövcuddur — bazada yalnız hash saxlanılır
 * və onu bir daha oxumaq mümkün deyil. Toast bunun üçün yararsızdır: 4 saniyəyə itir,
 * mətn seçilə bilmir. Panel isə səhifə yenilənənə qədər qalır və köçürmə düyməsi verir.
 */
export function SecretPanel({
  secret,
  title,
  note,
  className,
}: {
  secret: string;
  title?: string;
  note?: string;
  className?: string;
}) {
  const t = useTranslations("admin");
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 4000);
    } catch {
      // Clipboard icazəsi yoxdursa, dəyər onsuz da ekranda seçilə bilir
      setCopied(false);
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xs border border-gold/50 bg-gold/10 px-4 py-3",
        className,
      )}
    >
      <p className="flex items-center gap-2 text-sm font-medium text-ink">
        <KeyRound className="size-4 shrink-0 text-gold-deep" aria-hidden="true" />
        {title ?? t("components.secret.title")}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <code className="tabular flex-1 whitespace-pre-wrap rounded-xs border border-line bg-paper px-3 py-2 font-mono text-base tracking-wider text-ink select-all">
          {secret}
        </code>
        <button
          type="button"
          onClick={copy}
          className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xs border border-line-strong px-3 text-sm text-ink transition-colors hover:border-gold hover:text-gold-deep"
        >
          {copied ? (
            <Check className="size-4 text-success" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )}
          {copied ? t("components.secret.copied") : t("components.secret.copy")}
        </button>
      </div>

      <p className="text-xs text-ink-soft">
        {note ??
          t("components.secret.hint")}
      </p>
    </div>
  );
}
