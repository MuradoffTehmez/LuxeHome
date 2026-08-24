"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Link2, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { siteUrl } from "@/config/site";
import { FacebookIcon, TelegramIcon, WhatsAppIcon } from "./brand-icons";

export type ShareButtonsProps = {
  /** Sayt kökünə nisbi yol, məsələn `/emlaklar/villa-slug`. */
  path: string;
  title: string;
  /** Detal toolbar-ı üçün vahid native-share/copy düyməsi. */
  compact?: boolean;
  className?: string;
};

const ITEM =
  "inline-flex min-h-11 items-center gap-2 rounded-xs border border-line-strong px-3.5 " +
  "text-sm text-ink-soft transition-colors duration-200 " +
  "hover:border-gold hover:text-gold-deep cursor-pointer";

export function ShareButtons({ path, title, compact = false, className }: ShareButtonsProps) {
  const t = useTranslations("property.share");
  const [copied, setCopied] = useState(false);
  const url = siteUrl(path);

  const targets = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`,
      icon: <WhatsAppIcon className="size-4" />,
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      icon: <FacebookIcon className="size-4" />,
    },
    {
      label: "Telegram",
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      icon: <TelegramIcon className="size-4" />,
    },
  ];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard API bloklanıbsa istifadəçi linki ünvan sətrindən köçürə bilər.
    }
  }

  async function shareLink() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text: title, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    await copyLink();
  }

  if (compact) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <button
          type="button"
          onClick={shareLink}
          aria-label={t("listing")}
          aria-live="polite"
          className={cn(ITEM, "w-full justify-center border-0")}
        >
          {copied ? (
            <Check className="size-4 text-success" aria-hidden="true" />
          ) : (
            <Share2 className="size-4" aria-hidden="true" />
          )}
          <span className="hidden sm:inline">{copied ? t("copied") : t("label")}</span>
        </button>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="mr-1 text-sm font-medium text-ink">{t("label")}:</span>

      {targets.map((target) => (
        <a
          key={target.label}
          href={target.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("via", { network: target.label })}
          className={ITEM}
        >
          {target.icon}
          <span className="hidden sm:inline">{target.label}</span>
        </a>
      ))}

      <button type="button" onClick={copyLink} className={ITEM} aria-live="polite">
        {copied ? (
          <Check className="size-4 text-success" aria-hidden="true" />
        ) : (
          <Link2 className="size-4" aria-hidden="true" />
        )}
        <span className="hidden sm:inline">
          {copied ? t("copied") : t("copyLink")}
        </span>
      </button>
    </div>
  );
}
