import {
  Blocks,
  Building2,
  Images,
  Inbox,
  LayoutDashboard,
  Newspaper,
  Settings,
  Sparkles,
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
  Blocks,
  Newspaper,
  Sparkles,
  Images,
  Inbox,
  Users,
  UserCog,
  Settings,
};

export function AdminIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name];
  if (!Icon) return null;
  return <Icon className={className} aria-hidden="true" />;
}
