import { describe, expect, it } from "vitest";
import { adminNav, adminNavBreadcrumbs, adminNavForRole, findAdminNavLocation } from "../admin-nav";

const allHrefs = () =>
  adminNav.flatMap((group) => group.items.flatMap((item) => (item.children?.length ? item.children.map((child) => child.href) : [item.href])));

describe("adminNav", () => {
  it("11 əsas modulu dörd qrupda saxlayır", () => {
    expect(adminNav.map((group) => group.titleKey)).toEqual(["general", "operations", "growth", "system"]);
    const parentLabels = adminNav.flatMap((group) => group.items.map((item) => item.labelKey));
    expect(parentLabels).toEqual([
      "dashboard",
      "portfolio",
      "promotionHub",
      "agencyHub",
      "crm",
      "trustHub",
      "contentHub",
      "serp",
      "analytics",
      "finance",
      "administration",
      "profile",
    ]);
  });

  it("konsolidasiyadan əvvəlki bütün səhifələri menyuda saxlayır (funksiya itmir)", () => {
    const legacy = [
      "/admin", "/admin/emlaklar", "/admin/moderation", "/admin/kocurmeler", "/admin/vip", "/admin/irelicekme",
      "/admin/layiheler", "/admin/taksonomiya", "/admin/ictimai-imkanlar", "/admin/paketler", "/admin/sikayetler",
      "/admin/etibarliliq", "/admin/senedler", "/admin/etirazlar", "/admin/moderasiya-tarixcesi", "/admin/tehlukesizlik",
      "/admin/blog", "/admin/bilik-merkezi", "/admin/xeberdarliqlar", "/admin/tercumeler", "/admin/xidmetler", "/admin/media",
      "/admin/terefdaslar", "/admin/muracietler", "/admin/muracietler/lovhe", "/admin/huni", "/admin/rezervasiyalar",
      "/admin/rezervasiyalar/teqvim", "/admin/e-poct", "/admin/hesablar", "/admin/agentlikler/tesdiq", "/admin/agentlikler",
      "/admin/agentler", "/admin/serp", "/admin/redirects", "/admin/seo", "/admin/redirects#not-found", "/admin/analitika",
      "/admin/hesabatlar", "/admin/ai-komekci", "/admin/maliyye", "/admin/maliyye/abuneler", "/admin/maliyye/endirimler",
      "/admin/maliyye/kampaniyalar", "/admin/maliyye/odenisler", "/admin/istifadeciler", "/admin/security", "/admin/audit",
      "/admin/parametrler", "/admin/sistem", "/admin/funksiyalar", "/admin/demo-mezmun", "/admin/hesabim",
    ];
    const hrefs = allHrefs();
    for (const href of legacy) expect(hrefs, href).toContain(href);
    expect(hrefs).toContain("/admin/tesviq");
  });

  it("hər səhifənin yalnız bir giriş nöqtəsi var", () => {
    const hrefs = allHrefs();
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("SERP və SEO-nun bütün alətlərini monitorinq/məzmun/konfiqurasiya bölmələrində verir", () => {
    const serp = adminNav.flatMap((group) => group.items).find((item) => item.labelKey === "serp");
    expect(serp?.children).toHaveLength(19);
    expect(serp?.children?.every((child) => child.section)).toBe(true);
    // Eyni bölmənin bəndləri ardıcıldır — başlıq bir dəfə çıxır.
    const sections = serp!.children!.map((child) => child.section);
    expect(sections.filter((section, index) => section !== sections[index - 1])).toEqual(["seoDaily", "seoContentGroup", "seoTechnical"]);
    expect(serp?.children?.map((item) => item.href)).toContain("/admin/seo");
    expect(serp?.children?.map((item) => item.href)).toContain("/admin/serp/search-console");
    expect(serp?.children?.map((item) => item.href)).toContain("/admin/redirects#not-found");
  });

  it("VIP, irəli çəkmə və paketləri «Elanların təşviqi» altında toplayır", () => {
    const hub = adminNav.flatMap((group) => group.items).find((item) => item.labelKey === "promotionHub");
    expect(hub?.children?.map((child) => child.href)).toEqual(["/admin/tesviq", "/admin/vip", "/admin/irelicekme", "/admin/paketler"]);
  });
});

describe("findAdminNavLocation", () => {
  it("ən uzun prefiksli bəndi tapır", () => {
    expect(findAdminNavLocation("/admin/rezervasiyalar/teqvim")?.child?.labelKey).toBe("calendar");
    expect(findAdminNavLocation("/admin/rezervasiyalar")?.child?.labelKey).toBe("reservations");
    expect(findAdminNavLocation("/admin/agentlikler/abc")?.child?.labelKey).toBe("agencies");
    expect(findAdminNavLocation("/admin/agentlikler/tesdiq")?.child?.labelKey).toBe("approvals");
    expect(findAdminNavLocation("/admin/serp/sitemap")?.item.labelKey).toBe("serp");
    expect(findAdminNavLocation("/admin/seo")?.child?.labelKey).toBe("seoLiveAudit");
  });

  it("alt menyusuz modulu və naməlum ünvanı düzgün qaytarır", () => {
    const profile = findAdminNavLocation("/admin/hesabim");
    expect(profile?.item.labelKey).toBe("profile");
    expect(profile?.child).toBeNull();
    expect(findAdminNavLocation("/admin")?.item.labelKey).toBe("dashboard");
    expect(findAdminNavLocation("/admin/namelum")).toBeNull();
  });
});

describe("adminNavBreadcrumbs", () => {
  it("qrup › modul › səhifə zəncirini qurur, cari səhifə link deyil", () => {
    expect(adminNavBreadcrumbs("/admin/vip")).toEqual([
      { kind: "group", key: "operations" },
      { kind: "item", key: "promotionHub", href: "/admin/tesviq" },
      { kind: "item", key: "vip", href: undefined },
    ]);
    expect(adminNavBreadcrumbs("/admin/emlaklar/abc/redakte").at(-1)).toEqual({ kind: "item", key: "portfolio", href: "/admin/emlaklar" });
    expect(adminNavBreadcrumbs("/admin/hesabim")).toEqual([{ kind: "group", key: "system" }, { kind: "item", key: "profile", href: undefined }]);
    expect(adminNavBreadcrumbs("/admin")).toEqual([]);
  });
});

describe("adminNavForRole", () => {
  const hrefs = (role: Parameters<typeof adminNavForRole>[0]) =>
    adminNavForRole(role).flatMap((group) => group.items.flatMap((item) => [item.href, ...(item.children ?? []).map((child) => child.href)]));

  it("Super Admin bütün menyunu görür", () => {
    expect(adminNavForRole("SUPER_ADMIN")).toEqual(adminNav);
  });

  it("Redaktor yalnız məzmun, media, tərcümə, tərəfdaş və SEO baxışını görür", () => {
    const nav = adminNavForRole("EDITOR");
    expect(nav.flatMap((group) => group.items.map((item) => item.labelKey))).toEqual(["dashboard", "contentHub", "serp", "profile"]);
    const editor = hrefs("EDITOR");
    expect(editor).not.toContain("/admin/emlaklar");
    expect(editor).not.toContain("/admin/xidmetler");
    expect(editor).not.toContain("/admin/ai-komekci");
    expect(editor).not.toContain("/admin/seo");
    expect(editor).toContain("/admin/redirects");
  });

  it("Admin parametrləri, analitikanı və istifadəçiləri görmür, modul linki ilk icazəli bəndə yönəlir", () => {
    const nav = adminNavForRole("ADMIN");
    const labels = nav.flatMap((group) => group.items.map((item) => item.labelKey));
    expect(labels).not.toContain("administration");
    expect(labels).not.toContain("agencyHub");
    const admin = hrefs("ADMIN");
    expect(admin).not.toContain("/admin/audit");
    expect(admin).not.toContain("/admin/analitika");
    const analytics = nav.flatMap((group) => group.items).find((item) => item.labelKey === "analytics");
    expect(analytics?.href).toBe("/admin/hesabatlar");
  });
});

describe("rol üzrə breadcrumb", () => {
  it("modul linki icazəli ilk alt bəndə aparır", () => {
    expect(adminNavBreadcrumbs("/admin/hesabatlar", "ADMIN")).toEqual([
      { kind: "group", key: "growth" },
      { kind: "item", key: "analytics", href: undefined },
    ]);
    expect(adminNavBreadcrumbs("/admin/hesabatlar", "SUPER_ADMIN")[1]).toEqual({ kind: "item", key: "analytics", href: "/admin/analitika" });
  });
});
