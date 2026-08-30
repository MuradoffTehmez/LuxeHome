import {
  BarChart3,
  CalendarCheck,
  Blocks,
  Building2,
  BrainCircuit,
  ClipboardCheck,
  Contact,
  History,
  Handshake,
  Images,
  Inbox,
  LayoutDashboard,
  Languages,
  Mail,
  MapPinned,
  Newspaper,
  Route,
  SearchCheck,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Tags,
  UserCog,
  UserRoundCheck,
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
  BrainCircuit,
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
  CalendarCheck,
  ClipboardCheck,
  History,
  Handshake,
  Mail,
  MapPinned,
  Languages,
  UserRoundCheck,
};

export function AdminIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name];
  if (!Icon) return null;
  return <Icon className={className} aria-hidden="true" />;
}
