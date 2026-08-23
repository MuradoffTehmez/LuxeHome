import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Building2 } from "lucide-react";

export type MobileCategoryRailItem = {
  href: string;
  label: string;
  count: number;
  imageUrl?: string | null;
};

export type MobileCategoryRailProps = {
  items: readonly MobileCategoryRailItem[];
};

/** 320–1023 px-də kateqoriyaları bir-birinə sıxışdırmadan göstərən swipe rail. */
export function MobileCategoryRail({ items }: MobileCategoryRailProps) {
  if (items.length === 0) return null;

  return (
    <ul
      aria-label="Əmlak kateqoriyaları"
      className="-mx-4 mt-10 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:hidden [&::-webkit-scrollbar]:hidden"
    >
      {items.map((item) => (
        <li key={item.href} className="w-[78vw] max-w-xs shrink-0 snap-start">
          <Link
            href={item.href}
            className="group relative flex aspect-4/3 min-h-44 overflow-hidden rounded-sm border border-line bg-beige focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
          >
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt=""
                fill
                loading="lazy"
                sizes="78vw"
                className="image-lift object-cover"
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-ink-muted">
                <Building2 className="size-10" aria-hidden="true" />
              </span>
            )}

            <span
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/25 to-transparent"
            />
            <span className="relative mt-auto flex w-full items-end justify-between gap-3 p-5">
              <span>
                <span className="block font-display text-2xl text-white">{item.label}</span>
                <span className="tabular mt-1 block text-sm text-white/75">
                  {item.count} elan
                </span>
              </span>
              <ArrowUpRight className="size-5 shrink-0 text-gold-soft" aria-hidden="true" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
