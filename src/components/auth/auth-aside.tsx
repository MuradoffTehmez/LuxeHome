import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { getSiteImages } from "@/lib/settings";
import { isUnoptimizedImage } from "@/lib/utils";

/**
 * Giriş və qeydiyyat səhifəsinin yan paneli.
 *
 * Əvvəl bej fonda sadə mətn idi və uzun formanın yanında boş sahə kimi qalırdı.
 * İndi saytın hero fotosu (`Parametrlər → Saytın şəkilləri`) üzərində brend kartıdır.
 * Foto üzərindəki mətn sabit `black/<opacity>` qradiyenti ilə oxunaqlı saxlanılır —
 * `charcoal`/`navy` tokeni tünd rejimdə açığa dönür (CLAUDE.md, dizayn sistemi).
 */
export async function AuthAside({
  eyebrow,
  title,
  items,
}: {
  eyebrow: string;
  title: string;
  items: string[];
}) {
  const { hero } = await getSiteImages();

  return (
    <div className="relative isolate flex min-h-[34rem] flex-col justify-end overflow-hidden rounded-xl p-10 text-white shadow-editorial">
      <Image
        src={hero}
        alt=""
        fill
        sizes="(min-width: 1024px) 45vw, 1px"
        unoptimized={isUnoptimizedImage(hero)}
        className="-z-10 object-cover"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/45 to-black/10" />
      <div aria-hidden="true" className="absolute inset-x-10 top-10 h-px bg-gradient-to-r from-gold-soft/80 to-transparent" />

      <p className="text-xs font-semibold tracking-[0.18em] text-gold-soft uppercase">{eyebrow}</p>
      <h2 className="mt-3 max-w-md text-balance font-display text-4xl leading-tight text-white">{title}</h2>
      <ul className="mt-8 grid gap-3.5 text-sm text-white/90">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-3">
            <CheckCircle2 className="size-5 shrink-0 text-gold-soft" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
