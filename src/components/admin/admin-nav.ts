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
  badgeKey?: "newLeads" | "draftProperties";
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
      { label: "Taksonomiya", href: "/admin/taksonomiya", icon: "Tags" },
      { label: "Layihələr", href: "/admin/layiheler", icon: "Blocks" },
      { label: "Bloq", href: "/admin/blog", icon: "Newspaper" },
      { label: "Xidmətlər", href: "/admin/xidmetler", icon: "Sparkles" },
      { label: "Media", href: "/admin/media", icon: "Images" },
      { label: "Agentliklər", href: "/admin/agentlikler", icon: "ShieldCheck" },
      { label: "SEO auditı", href: "/admin/seo", icon: "SearchCheck" },
    ],
  },
  {
    title: "Satış",
    items: [
      { label: "Müraciətlər", href: "/admin/muracietler", icon: "Inbox", badgeKey: "newLeads" },
    ],
  },
  {
    title: "Sistem",
    items: [
      { label: "İstifadəçilər", href: "/admin/istifadeciler", icon: "Users" },
      { label: "Hesablar", href: "/admin/hesablar", icon: "Contact" },
      { label: "Hesabım", href: "/admin/hesabim", icon: "UserCog" },
      { label: "Parametrlər", href: "/admin/parametrler", icon: "Settings" },
    ],
  },
];
