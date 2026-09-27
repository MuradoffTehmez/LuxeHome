"use client";

import { useState } from "react";
import { ExternalLink, Rotate3d } from "lucide-react";

/**
 * 360° virtual tur (#107).
 *
 * Yalnız tanınan platformalar embed olunur — naməlum ünvanı `iframe`-ə salmaq saytın
 * içində nəzarətsiz kənar məzmun deməkdir (CSP `frame-src` də yalnız bunlara icazə verir).
 * Tur ağırdır (WebGL, bir neçə MB), ona görə səhifə açılanda deyil, düyməyə basanda yüklənir.
 */
export function tourEmbedUrl(rawUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.replace(/^www\./, "");

  if (host === "kuula.co") {
    const id = url.pathname.match(/^\/(?:share|post)\/([A-Za-z0-9]+)/)?.[1];
    return id ? `https://kuula.co/share/${id}?fs=1&vr=1&thumbs=1&info=0&logo=0` : null;
  }
  if (host === "my.matterport.com") {
    const id = url.searchParams.get("m");
    return id && /^[A-Za-z0-9]+$/.test(id) ? `https://my.matterport.com/show/?m=${id}&play=1` : null;
  }
  if (host === "momento360.com") {
    return url.pathname.startsWith("/e/") ? `https://momento360.com${url.pathname}` : null;
  }
  return null;
}

type PropertyTourProps = {
  url: string;
  labels: { heading: string; start: string; note: string; open: string };
};

export function PropertyTour({ url, labels }: PropertyTourProps) {
  const [active, setActive] = useState(false);
  const embed = tourEmbedUrl(url);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="flex items-center gap-2 font-sans text-lg font-semibold text-ink">
        <Rotate3d className="size-5 text-gold-deep" aria-hidden="true" />
        {labels.heading}
      </h2>
      {embed ? (
        <div className="relative aspect-video overflow-hidden rounded-lg border border-line bg-navy">
          {active ? (
            <iframe
              src={embed}
              title={labels.heading}
              className="absolute inset-0 size-full"
              allow="fullscreen; xr-spatial-tracking; gyroscope; accelerometer"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <button
              type="button"
              onClick={() => setActive(true)}
              className="on-dark absolute inset-0 flex flex-col items-center justify-center gap-3 text-ivory transition-colors hover:bg-white/5"
            >
              <span className="grid size-16 place-items-center rounded-full bg-gold text-on-gold shadow-lg">
                <Rotate3d className="size-8" aria-hidden="true" />
              </span>
              <span className="text-base font-semibold">{labels.start}</span>
              <span className="text-xs text-ivory/70">{labels.note}</span>
            </button>
          )}
        </div>
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 w-fit items-center gap-2 rounded-sm border border-line px-4 text-sm font-medium text-ink hover:border-gold hover:text-gold-deep"
        >
          <ExternalLink className="size-4" aria-hidden="true" />
          {labels.open}
        </a>
      )}
    </section>
  );
}
