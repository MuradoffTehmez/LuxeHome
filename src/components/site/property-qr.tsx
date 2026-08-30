"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Download, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEM =
  "inline-flex min-h-11 items-center gap-2 rounded-xs border border-line-strong px-3.5 " +
  "text-sm text-ink-soft transition-colors duration-200 " +
  "hover:border-gold hover:text-gold-deep cursor-pointer";

/** Fayl adında istifadə üçün slug-u təhlükəsiz saxlayır. */
function fileBase(slug: string): string {
  return slug.replace(/[^a-z0-9-]/gi, "").slice(0, 80) || "qr";
}

function triggerDownload(href: string, filename: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/**
 * Əmlakın QR kodu və PNG/SVG yükləməsi (PRD bölmə 61-63).
 *
 * SVG server tərəfdə hazırlanıb `svg` propu ilə gəlir — brauzerdə QR kitabxanası
 * yüklənmir. PNG həmin SVG-dən `canvas` üzərində çıxarılır: ayrıca server marşrutu
 * və ya kənar servis lazım gəlmir, çap üçün isə 1024 px kifayət qədər böyükdür.
 */
export function PropertyQr({ svg, slug, className }: { svg: string; slug: string; className?: string }) {
  const t = useTranslations("property.qr");
  const [busy, setBusy] = useState(false);
  const objectUrls = useRef<string[]>([]);

  function svgBlobUrl(): string {
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
    objectUrls.current.push(url);
    return url;
  }

  function downloadSvg() {
    const url = svgBlobUrl();
    triggerDownload(url, `${fileBase(slug)}-qr.svg`);
    // Yükləmə başladıqdan sonra URL-i buraxmaq olar; kiçik gecikmə Safari üçündür.
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  function downloadPng() {
    setBusy(true);
    const url = svgBlobUrl();
    const image = new Image();
    image.onload = () => {
      const size = 1024;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");
      if (context) {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, size, size);
        context.drawImage(image, 0, 0, size, size);
        triggerDownload(canvas.toDataURL("image/png"), `${fileBase(slug)}-qr.png`);
      }
      URL.revokeObjectURL(url);
      setBusy(false);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      setBusy(false);
    };
    image.src = url;
  }

  return (
    <details className={cn("group", className)}>
      <summary className={cn(ITEM, "list-none marker:hidden")}>
        <QrCode className="size-4" aria-hidden="true" />
        {t("label")}
      </summary>

      <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div
          className="w-40 shrink-0 rounded-xs border border-line bg-white p-2 [&>svg]:h-auto [&>svg]:w-full"
          // QR mənbəyi server tərəfdə `qrcode-svg` ilə çəkilir; istifadəçi girişi
          // yalnız elanın öz slug-udur, ona görə HTML kimi yerləşdirmək təhlükəsizdir.
          dangerouslySetInnerHTML={{ __html: svg }}
          role="img"
          aria-label={t("alt")}
        />
        <div className="flex flex-col gap-2">
          <p className="max-w-sm text-sm text-ink-soft">{t("description")}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={downloadPng} className={ITEM} disabled={busy}>
              <Download className="size-4" aria-hidden="true" />
              {t("downloadPng")}
            </button>
            <button type="button" onClick={downloadSvg} className={ITEM}>
              <Download className="size-4" aria-hidden="true" />
              {t("downloadSvg")}
            </button>
          </div>
        </div>
      </div>
    </details>
  );
}
