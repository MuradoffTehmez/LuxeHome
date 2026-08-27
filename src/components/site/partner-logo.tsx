import Image from "next/image";
import { Building2 } from "lucide-react";
import { cn, isUnoptimizedImage } from "@/lib/utils";
import { partnerLogoVariants, type PartnerLogoSource } from "@/lib/partners";

type PartnerLogoProps = {
  partner: PartnerLogoSource & { name: string };
  /** Konteynerin hündürlüyü. Loqonun eni məzmuna görə dəyişir. */
  size?: "sm" | "md" | "lg" | "xl";
  /**
   * Above-the-fold loqo (ana səhifədəki tərəfdaşlıq bloku, profil hero-su).
   * Yalnız görünən sahədəki loqolar üçün verilir — qalanları lazy qalır.
   */
  priority?: boolean;
  className?: string;
};

/**
 * Tərəfdaş loqosu.
 *
 * İki qayda burada mərkəzləşdirilib ki, hər səhifədə təkrarlanmasın:
 *
 * 1. **Aspect ratio pozulmur.** Konteyner sabit hündürlükdədir, `object-contain`
 *    eni sərbəst buraxır. `fill` + `object-cover` loqonu kəsərdi — brend
 *    qaydalarına görə kəsmək, dartmaq və rəngini dəyişmək qadağandır.
 * 2. **Tema variantı CSS ilə seçilir** (`theme-light-only` / `theme-dark-only`),
 *    `useTheme()` ilə yox: server HTML-i dərhal doğru olur, tema sıçrayışı olmur.
 *    Brend yalnız bir loqo veribsə tək `<Image>` render olunur.
 */
const SIZES = {
  sm: { box: "h-8", width: 160, height: 40, sizes: "160px" },
  md: { box: "h-11", width: 220, height: 56, sizes: "220px" },
  lg: { box: "h-14", width: 300, height: 72, sizes: "300px" },
  xl: { box: "h-16 sm:h-20", width: 420, height: 96, sizes: "(max-width: 640px) 240px, 420px" },
} as const;

export function PartnerLogo({
  partner,
  size = "md",
  priority = false,
  className,
}: PartnerLogoProps) {
  const { light, dark, hasThemeVariants } = partnerLogoVariants(partner);
  const config = SIZES[size];

  if (!light && !dark) {
    return (
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-xs bg-beige px-4 text-ink-muted",
          config.box,
          className,
        )}
      >
        <Building2 className="size-5" aria-hidden="true" />
        <span className="sr-only">{partner.name}</span>
      </span>
    );
  }

  const common = {
    // Alt mətn şirkətin adıdır — ekran oxuyucu loqonu ad kimi oxuyur.
    alt: partner.name,
    width: config.width,
    height: config.height,
    sizes: config.sizes,
    className: "h-full w-auto max-w-full object-contain object-left",
    ...(priority ? { priority: true } : { loading: "lazy" as const }),
  };

  if (!hasThemeVariants) {
    const src = (light ?? dark) as string;
    return (
      <span className={cn("flex shrink-0 items-center", config.box, className)}>
        <Image src={src} unoptimized={isUnoptimizedImage(src)} {...common} />
      </span>
    );
  }

  // İki variantın ikisi də DOM-dadır, biri `display: none`. Gizli element ekran
  // oxuyucuya çatmır, ona görə ad `sr-only` mətnə köçürülür və hər iki şəkil
  // dekorativ (`alt=""`) olur — əks halda dark rejimdə loqonun adı itərdi.
  return (
    <span className={cn("flex shrink-0 items-center", config.box, className)}>
      <span className="sr-only">{partner.name}</span>
      <span className={cn("theme-light-only h-full", config.box)} aria-hidden="true">
        <Image
          src={light as string}
          unoptimized={isUnoptimizedImage(light as string)}
          {...common}
          alt=""
        />
      </span>
      <span className={cn("theme-dark-only h-full", config.box)} aria-hidden="true">
        <Image
          src={dark as string}
          unoptimized={isUnoptimizedImage(dark as string)}
          {...common}
          alt=""
        />
      </span>
    </span>
  );
}
