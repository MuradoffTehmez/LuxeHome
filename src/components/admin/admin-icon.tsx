import {
  Blocks,
  Building2,
  Contact,
  Images,
  Inbox,
  LayoutDashboard,
  Newspaper,
  SearchCheck,
  Settings,
  ShieldCheck,
  Sparkles,
  Tags,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * İkon adlarının icazə verilən siyahısı.
 * Sətir → komponent xəritəsi dinamik `lucide[name]` müraciətindən təhlükəsizdir:
 * naməlum ad gəlsə, ikon sadəcə göstərilmir.
 */
const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Building2,
  Contact,
  Blocks,
  Newspaper,
  Sparkles,
  Images,
  Inbox,
  Users,
  UserCog,
  Settings,
  SearchCheck,
  ShieldCheck,
  Tags,
};

export function AdminIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name];
  if (!Icon) return null;
  return <Icon className={className} aria-hidden="true" />;
}
