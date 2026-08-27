/**
 * Admin panelin naviqasiya strukturu.
 * Ayrı fayldadır ki, həm sidebar, həm mobil çekmece eyni mənbədən oxusun.
 */

export type AdminNavItem = {
  label: string;
  href: string;
  /** lucide-react ikon adı — `admin-icon.tsx` içindəki icazə siyahısından seçilir. */
  icon: string;
  /** Yan paneldə göstərilən sayğac açarı. */
  badgeKey?: "newLeads" | "draftProperties" | "pendingModeration";
};

export type AdminNavGroup = {
  title: string;
  items: AdminNavItem[];
};

export const adminNav: AdminNavGroup[] = [
  {
    title: "Ümumi",
    items: [{ label: "İdarə paneli", href: "/admin", icon: "LayoutDashboard" }],
  },
  {
    title: "Kontent",
    items: [
      { label: "Əmlaklar", href: "/admin/emlaklar", icon: "Building2", badgeKey: "draftProperties" },
      { label: "Moderasiya", href: "/admin/moderation", icon: "ClipboardCheck", badgeKey: "pendingModeration" },
      { label: "Taksonomiya", href: "/admin/taksonomiya", icon: "Tags" },
      { label: "Layihələr", href: "/admin/layiheler", icon: "Blocks" },
      { label: "Bloq", href: "/admin/blog", icon: "Newspaper" },
      { label: "Xidmətlər", href: "/admin/xidmetler", icon: "Sparkles" },
      { label: "Media", href: "/admin/media", icon: "Images" },
      { label: "Agentliklər", href: "/admin/agentlikler", icon: "ShieldCheck" },
      { label: "Tərəfdaşlar", href: "/admin/terefdaslar", icon: "Handshake" },
      { label: "SEO auditı", href: "/admin/seo", icon: "SearchCheck" },
      { label: "Yönləndirmələr", href: "/admin/redirects", icon: "Route" },
      { label: "Trafik analitikası", href: "/admin/analitika", icon: "BarChart3" },
    ],
  },
  {
    title: "Satış",
    items: [
      { label: "Müraciətlər", href: "/admin/muracietler", icon: "Inbox", badgeKey: "newLeads" },
      { label: "Korporativ e-poçt", href: "/admin/e-poct", icon: "Mail" },
    ],
  },
  {
    title: "Sistem",
    items: [
      { label: "İstifadəçilər", href: "/admin/istifadeciler", icon: "Users" },
      { label: "Hesablar", href: "/admin/hesablar", icon: "Contact" },
      { label: "Təhlükəsizlik", href: "/admin/security", icon: "ShieldAlert" },
      { label: "Audit jurnalı", href: "/admin/audit", icon: "History" },
      { label: "Hesabım", href: "/admin/hesabim", icon: "UserCog" },
      { label: "Parametrlər", href: "/admin/parametrler", icon: "Settings" },
    ],
  },
];
