import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AdminActionMenu } from "../admin-action-menu";
import { AdminListCard, AdminResponsiveList } from "../admin-responsive-list";

describe("admin responsive list primitive-ləri", () => {
  it("eyni məlumatı mobil kart və desktop table kimi təqdim edir", () => {
    const items = [{ id: "1", title: "Sahil villası" }];
    const html = renderToStaticMarkup(
      <AdminResponsiveList
        ariaLabel="Əmlak siyahısı"
        items={items}
        getKey={(item) => item.id}
        renderCard={(item) => <AdminListCard title={item.title}>Mobil məlumat</AdminListCard>}
        renderTable={() => <table><tbody><tr><td>Desktop məlumat</td></tr></tbody></table>}
        empty={<p>Boşdur</p>}
      />,
    );

    expect(html).toContain('aria-label="Əmlak siyahısı"');
    expect(html).toContain("lg:hidden");
    expect(html).toContain("hidden lg:block");
    expect(html).toContain("Sahil villası");
  });

  it("əməl menyusu trigger-ini 44 px və menu ARIA müqaviləsi ilə yaradır", () => {
    const html = renderToStaticMarkup(
      // eslint-disable-next-line @next/next/no-html-link-for-pages -- renderToStaticMarkup ilə saf test, Link router konteksti tələb edir
      <AdminActionMenu label="Əməliyyatlar"><a href="/redakte">Redaktə et</a></AdminActionMenu>,
    );

    expect(html).toContain('aria-haspopup="menu"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain("size-11");
  });
});
