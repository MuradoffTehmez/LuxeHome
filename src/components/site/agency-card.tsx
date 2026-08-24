import Image from "next/image";
import Link from "next/link";
import { Building2, MapPin, Phone } from "lucide-react";
import { cn, isUnoptimizedImage } from "@/lib/utils";

export type AgencyCardData = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  phone: string | null;
  address: string | null;
  propertyCount: number;
};

export function AgencyCard({
  agency,
  className,
}: {
  agency: AgencyCardData;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col gap-4 rounded-sm border border-line bg-paper p-5 transition-colors duration-200 hover:border-gold sm:p-6",
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-beige">
          {agency.logoUrl ? (
            <Image
              src={agency.logoUrl}
              alt={agency.name}
              fill
              unoptimized={isUnoptimizedImage(agency.logoUrl)}
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <Building2 className="size-7 text-ink-muted" aria-hidden="true" />
          )}
        </div>

        <div className="flex flex-col gap-0.5">
          <h3 className="font-display text-lg leading-snug text-ink">
            <Link
              href={`/agentlikler/${agency.slug}`}
              className="after:absolute after:inset-0 after:content-[''] inline-flex min-h-11 items-center hover:text-gold-deep"
            >
              {agency.name}
            </Link>
          </h3>
          <p className="text-xs font-medium tracking-wide text-gold-deep uppercase">
            {agency.propertyCount} elan
          </p>
        </div>
      </div>

      <dl className="mt-auto flex flex-col gap-2 border-t border-line pt-4 text-sm text-ink-muted">
        {agency.address && (
          <div className="flex items-start gap-1.5">
            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <dt className="sr-only">Ünvan</dt>
            <dd className="line-clamp-1">{agency.address}</dd>
          </div>
        )}
        {agency.phone && (
          <div className="flex items-center gap-1.5">
            <Phone className="size-4 shrink-0" aria-hidden="true" />
            <dt className="sr-only">Telefon</dt>
            <dd className="tabular">{agency.phone}</dd>
          </div>
        )}
      </dl>
    </article>
  );
}
