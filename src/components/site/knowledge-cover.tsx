import { BookOpen, Building2, House, KeyRound, Tag, TrendingUp, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KnowledgeAudience } from "@/lib/constants";

const AUDIENCE_ICONS: Record<KnowledgeAudience, LucideIcon> = {
  BUYER: House,
  SELLER: Tag,
  RENTER: KeyRound,
  LANDLORD: Building2,
  INVESTOR: TrendingUp,
};

/**
 * Bələdçinin üz qabığı şəkli olmayanda göstərilən brend səthi.
 *
 * Bələdçilərin çoxu foto tələb etmir; boş bej sahə əvəzinə qızılı «çertyoj» şəbəkəsi
 * üzərində auditoriyaya uyğun ikon (alıcı — ev, satıcı — etiket, investor — artım)
 * göstərilir. Rənglər token və qızıl tondur, ona görə hər iki temada kontrast saxlanılır;
 * səth dekorativdir (`aria-hidden`).
 */
export function KnowledgeCover({ audience, className }: { audience: string; className?: string }) {
  const Icon = AUDIENCE_ICONS[audience as KnowledgeAudience] ?? BookOpen;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative isolate grid size-full place-items-center overflow-hidden bg-[linear-gradient(135deg,var(--color-beige)_0%,var(--color-ivory)_100%)]",
        className,
      )}
    >
      <span className="absolute inset-0 bg-[linear-gradient(to_right,rgb(196_165_117/0.22)_1px,transparent_1px),linear-gradient(to_bottom,rgb(196_165_117/0.22)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_78%)]" />
      <Icon className="absolute -right-6 -bottom-9 size-44 text-gold/15" strokeWidth={1} />
      <span className="relative grid size-16 place-items-center rounded-full border border-gold-line bg-paper text-gold-deep shadow-sm">
        <Icon className="size-7" strokeWidth={1.5} />
      </span>
    </div>
  );
}
