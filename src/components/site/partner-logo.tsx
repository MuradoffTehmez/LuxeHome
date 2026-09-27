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

const WORDMARK_TEXT = { sm: "text-sm", md: "text-base", lg: "text-lg", xl: "text-xl sm:text-2xl" } as const;
const WORDMARK_ICON = { sm: "size-4", md: "size-5", lg: "size-6", xl: "size-7 sm:size-8" } as const;

export function PartnerLogo({
  partner,
  size = "md",
  priority = false,
  className,
}: PartnerLogoProps) {
  const { light, dark, hasThemeVariants, hasDarkOnly } = partnerLogoVariants(partner);
  const config = SIZES[size];

  // Loqo yoxdursa brendin adı wordmark kimi yazılır. Əvvəlki boz ikon qutusu
  // (kartda bütün eni tutan zolaq) ana səhifədə «şəkil yüklənmədi» kimi görünürdü.
  if (!light && !dark) {
    return (
      <span className={cn("inline-flex max-w-full shrink-0 items-center gap-2.5 self-start", config.box, className)}>
        <Building2 className={cn("shrink-0 text-gold-deep", WORDMARK_ICON[size])} aria-hidden="true" />
        <span className={cn("truncate font-display font-semibold tracking-[0.08em] text-ink uppercase", WORDMARK_TEXT[size])}>
          {partner.name}
        </span>
      </span>
    );
  }

  const common = {
    width: config.width,
    height: config.height,
    sizes: config.sizes,
    className: "h-full w-auto max-w-full object-contain object-left",
    ...(priority ? { priority: true } : { loading: "lazy" as const }),
  };

  if (!hasThemeVariants) {
    const src = (light ?? dark) as string;
    return (
      <span
        className={cn(
          // `w-fit`: flex-col kartda konteyner əks halda bütün eni tutur və tünd
          // fonlu loqo kartın enində zolağa çevrilirdi
          "flex w-fit max-w-full shrink-0 items-center",
          // Sabit tünd fon: `bg-navy` tünd rejimdə açığa dönür və ağ loqo görünmürdü
          hasDarkOnly && "rounded-sm bg-[#17202b] px-3 py-2",
          config.box,
          className,
        )}
      >
        <Image
          src={src}
          alt={partner.name}
          unoptimized={isUnoptimizedImage(src)}
          {...common}
        />
      </span>
    );
  }

  // İki variantın ikisi də DOM-dadır, biri `display: none`. Gizli element ekran
  // oxuyucuya çatmır, ona görə ad `sr-only` mətnə köçürülür və hər iki şəkil
  // dekorativ (`alt=""`) olur — əks halda dark rejimdə loqonun adı itərdi.
  return (
    <span className={cn("flex w-fit max-w-full shrink-0 items-center", config.box, className)}>
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
