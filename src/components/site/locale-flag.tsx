import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/constants";

type LocaleFlagProps = {
  locale: Locale;
  className?: string;
};

/**
 * Emoji bayraqları Windows və bəzi Android şriftlərində iki hərf kimi görünür.
 * Bu kiçik SVG-lər platforma şriftindən asılı deyil və bütün brauzerlərdə eynidir.
 */
export function LocaleFlag({ locale, className }: LocaleFlagProps) {
  const common = {
    viewBox: "0 0 30 20",
    role: "presentation",
    "aria-hidden": true,
    focusable: false,
    "data-locale-flag": locale,
    className: cn("h-3.5 w-[1.3125rem] shrink-0 rounded-[2px] shadow-[0_0_0_1px_rgba(23,32,43,0.18)]", className),
  } as const;

  if (locale === "az") {
    return (
      <svg {...common}>
        <path fill="#00B5E2" d="M0 0h30v6.667H0z" />
        <path fill="#EF3340" d="M0 6.667h30v6.666H0z" />
        <path fill="#509E2F" d="M0 13.333h30V20H0z" />
        <circle cx="14.1" cy="10" r="3.15" fill="#fff" />
        <circle cx="15.35" cy="10" r="2.55" fill="#EF3340" />
        <path fill="#fff" d="m19.35 7.65.53 1.48 1.57.05-1.24.96.44 1.51-1.3-.88-1.3.88.44-1.51-1.24-.96 1.57-.05z" />
      </svg>
    );
  }

  if (locale === "en") {
    return (
      <svg {...common}>
        <path fill="#012169" d="M0 0h30v20H0z" />
        <path stroke="#fff" strokeWidth="4.4" d="m0 0 30 20M30 0 0 20" />
        <path stroke="#C8102E" strokeWidth="2" d="m0 0 30 20M30 0 0 20" />
        <path stroke="#fff" strokeWidth="6.5" d="M15 0v20M0 10h30" />
        <path stroke="#C8102E" strokeWidth="3.5" d="M15 0v20M0 10h30" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path fill="#fff" d="M0 0h30v6.667H0z" />
      <path fill="#0039A6" d="M0 6.667h30v6.666H0z" />
      <path fill="#D52B1E" d="M0 13.333h30V20H0z" />
    </svg>
  );
}
