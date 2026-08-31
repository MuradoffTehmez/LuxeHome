/**
 * Admin panelin naviqasiya strukturu.
 * Ayrı fayldadır ki, həm sidebar, həm mobil çekmece eyni mənbədən oxusun.
 *
 * Etiketlər burada saxlanılmır: `labelKey` / `titleKey` `admin.nav` kataloqundakı
 * açarlardır, mətn render anında istifadəçinin dilinə görə seçilir. Açar tipləri
 * kataloqdan törəyir — tərcüməsi olmayan menyu sətri tip yoxlamasından keçmir.
 */

import type { AdminNavGroupKey, AdminNavItemKey } from "@/i18n/admin";

export type AdminNavItem = {
  /** `admin.nav.items` altındakı açar. */
  labelKey: AdminNavItemKey;
  href: string;
  /** lucide-react ikon adı — `admin-icon.tsx` içindəki icazə siyahısından seçilir. */
  icon: string;
  /** Yan paneldə göstərilən sayğac açarı. */
  badgeKey?: "newLeads" | "draftProperties" | "pendingModeration";
};

export type AdminNavGroup = {
  /** `admin.nav.groups` altındakı açar. */
  titleKey: AdminNavGroupKey;
  items: AdminNavItem[];
};

export const adminNav: AdminNavGroup[] = [
  {
    titleKey: "general",
    items: [{ labelKey: "dashboard", href: "/admin", icon: "LayoutDashboard" }],
  },
  {
    titleKey: "content",
    items: [
      { labelKey: "properties", href: "/admin/emlaklar", icon: "Building2", badgeKey: "draftProperties" },
      { labelKey: "moderation", href: "/admin/moderation", icon: "ClipboardCheck", badgeKey: "pendingModeration" },
      { labelKey: "taxonomy", href: "/admin/taksonomiya", icon: "Tags" },
      { labelKey: "projects", href: "/admin/layiheler", icon: "Blocks" },
      { labelKey: "blog", href: "/admin/blog", icon: "Newspaper" },
      { labelKey: "knowledge", href: "/admin/bilik-merkezi", icon: "BookOpen" },
      { labelKey: "translations", href: "/admin/tercumeler", icon: "Languages" },
      { labelKey: "services", href: "/admin/xidmetler", icon: "Sparkles" },
      { labelKey: "media", href: "/admin/media", icon: "Images" },
      { labelKey: "agencies", href: "/admin/agentlikler", icon: "ShieldCheck" },
      { labelKey: "agents", href: "/admin/agentler", icon: "UserRoundCheck" },
      { labelKey: "publicAmenities", href: "/admin/ictimai-imkanlar", icon: "MapPinned" },
      { labelKey: "aiAssistant", href: "/admin/ai-komekci", icon: "BrainCircuit" },
      { labelKey: "partners", href: "/admin/terefdaslar", icon: "Handshake" },
      { labelKey: "serp", href: "/admin/serp", icon: "SearchCheck" },
      { labelKey: "redirects", href: "/admin/redirects", icon: "Route" },
      { labelKey: "analytics", href: "/admin/analitika", icon: "BarChart3" },
    ],
  },
  {
    titleKey: "sales",
    items: [
      { labelKey: "leads", href: "/admin/muracietler", icon: "Inbox", badgeKey: "newLeads" },
      { labelKey: "reservations", href: "/admin/rezervasiyalar", icon: "CalendarCheck" },
      { labelKey: "email", href: "/admin/e-poct", icon: "Mail" },
    ],
  },
  {
    titleKey: "system",
    items: [
      { labelKey: "users", href: "/admin/istifadeciler", icon: "Users" },
      { labelKey: "accounts", href: "/admin/hesablar", icon: "Contact" },
      { labelKey: "security", href: "/admin/security", icon: "ShieldAlert" },
      { labelKey: "audit", href: "/admin/audit", icon: "History" },
      { labelKey: "profile", href: "/admin/hesabim", icon: "UserCog" },
      { labelKey: "settings", href: "/admin/parametrler", icon: "Settings" },
    ],
  },
];
