"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { siteUrl } from "@/config/site";
import { FacebookIcon, TelegramIcon, WhatsAppIcon } from "./brand-icons";

type ShareButtonsProps = {
  /** Sayt kökünə nisbi yol, məsələn `/emlaklar/villa-slug`. */
  path: string;
  title: string;
  className?: string;
};

const ITEM =
  "inline-flex min-h-11 items-center gap-2 rounded-xs border border-line-strong px-3.5 " +
  "text-sm text-ink-soft transition-colors duration-200 " +
  "hover:border-gold hover:text-gold-deep cursor-pointer";

export function ShareButtons({ path, title, className }: ShareButtonsProps) {
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

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="mr-1 text-sm font-medium text-ink">Paylaş:</span>

      {targets.map((target) => (
        <a
          key={target.label}
          href={target.href}
          target="_blank"
          rel="noopener noreferrer"
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
          {copied ? "Kopyalandı" : "Linki kopyala"}
        </span>
      </button>
    </div>
  );
}
