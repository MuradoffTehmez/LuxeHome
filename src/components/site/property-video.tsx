import { ExternalLink, PlayCircle } from "lucide-react";

/**
 * Elanın video turu.
 *
 * `Property.videoUrl` həm admin, həm də kabinet formasında doldurulurdu, amma
 * **ictimai səhifədə heç yerdə göstərilmirdi** — redaktor video linki yazır,
 * ziyarətçi onu heç vaxt görmürdü. Bu komponent həmin zənciri bağlayır.
 *
 * Tanınan platformalar embed olunur, qalanı adi keçid kimi verilir: naməlum
 * ünvanı `iframe`-ə salmaq saytın içində kənar məzmuna nəzarətsiz yer açardı.
 * YouTube üçün `youtube-nocookie.com` işlədilir — ziyarətçi videonu oynatmayana
 * qədər izləmə kuki-si qoyulmur.
 */

type EmbedSource = { src: string; title: string };

function toEmbed(rawUrl: string): EmbedSource | null {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.replace(/^www\./, "");

  // youtu.be/<id> və youtube.com/watch?v=<id> — hər ikisi eyni embed formasına düşür.
  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return id ? { src: `https://www.youtube-nocookie.com/embed/${id}`, title: "YouTube" } : null;
  }
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    const id = url.searchParams.get("v") ?? url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1];
    return id ? { src: `https://www.youtube-nocookie.com/embed/${id}`, title: "YouTube" } : null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = url.pathname.split("/").filter(Boolean).pop();
    return id && /^\d+$/.test(id)
      ? { src: `https://player.vimeo.com/video/${id}`, title: "Vimeo" }
      : null;
  }

  return null;
}

export function PropertyVideo({
  url,
  heading,
  openLabel,
}: {
  url: string;
  heading: string;
  /** Embed mümkün olmayan ünvanlar üçün keçid mətni. */
  openLabel: string;
}) {
  const embed = toEmbed(url);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="flex items-center gap-2 font-display text-xl text-ink">
        <PlayCircle className="size-5 text-gold-deep" aria-hidden="true" />
        {heading}
      </h2>

      {embed ? (
        <div className="relative aspect-video overflow-hidden rounded-md border border-line bg-charcoal">
          <iframe
            src={embed.src}
            title={heading}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 size-full border-0"
          />
        </div>
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xs border border-line px-4 text-sm text-ink-soft transition-colors hover:border-gold hover:text-gold-deep"
        >
          <ExternalLink className="size-4" aria-hidden="true" />
          {openLabel}
        </a>
      )}
    </section>
  );
}
