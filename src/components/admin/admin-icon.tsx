import {
  BarChart3,
  Blocks,
  Building2,
  ClipboardCheck,
  Contact,
  History,
  Images,
  Inbox,
  LayoutDashboard,
  Newspaper,
  Route,
  SearchCheck,
  Settings,
  ShieldAlert,
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
  Route,
  SearchCheck,
  ShieldAlert,
  ShieldCheck,
  Tags,
  BarChart3,
  ClipboardCheck,
  History,
};

export function AdminIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name];
  if (!Icon) return null;
  return <Icon className={className} aria-hidden="true" />;
}
