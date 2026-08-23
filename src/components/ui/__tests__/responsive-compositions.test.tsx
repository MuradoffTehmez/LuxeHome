import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActiveFilterChips } from "../active-filter-chips";
import { AdaptiveDataList } from "../adaptive-data-list";
import { PageHeader } from "../page-header";
import { ResponsiveToolbar } from "../responsive-toolbar";
import { StickyActionBar } from "../sticky-action-bar";

describe("responsive composition komponentləri", () => {
  it("səhifə başlığını breadcrumb və əsas əməl ilə semantik əlaqələndirir", () => {
    const html = renderToStaticMarkup(
      <PageHeader
        eyebrow="Əmlak kataloqu"
        title="Bakıda seçilmiş əmlaklar"
        description="Yoxlanılmış satış və kirayə elanları"
        breadcrumbs={[
          { label: "Ana səhifə", href: "/" },
          { label: "Əmlaklar" },
        ]}
        actions={<button type="button">Elan ver</button>}
      />,
    );

    expect(html).toContain('aria-label="Naviqasiya yolu"');
    expect(html).toContain('href="/"');
    expect(html).toContain('<h1');
    expect(html).toContain("Bakıda seçilmiş əmlaklar");
    expect(html).toContain("Yoxlanılmış satış və kirayə elanları");
    expect(html).toContain("Elan ver");
    expect(html).toContain('aria-current="page"');
  });

  it("toolbar-ın mobil və desktop təqdimatlarını yalnız CSS breakpoint-i ilə ayırır", () => {
    const html = renderToStaticMarkup(
      <ResponsiveToolbar
        mobile={<button type="button">Mobil filtrlər</button>}
        desktop={<form>Desktop filtrlər</form>}
      />,
    );

    expect(html).toContain("Mobil filtrlər");
    expect(html).toContain("Desktop filtrlər");
    expect(html).toContain("lg:hidden");
    expect(html).toContain("hidden lg:block");
    expect(html).toContain("top-[var(--header-h)]");
  });

  it("aktiv filtrləri ayrı-ayrılıqda və birlikdə sıfırlamaq üçün əlçatan linklər yaradır", () => {
    const html = renderToStaticMarkup(
      <ActiveFilterChips
        items={[
          { key: "type", label: "Villa", href: "/emlaklar?seher=baki" },
          { key: "city", label: "Bakı", href: "/emlaklar?tip=villa" },
        ]}
        resetHref="/emlaklar"
      />,
    );

    expect(html).toContain('aria-label="Aktiv filtrlər"');
    expect(html).toContain('aria-label="Villa filtrini sil"');
    expect(html).toContain('href="/emlaklar?seher=baki"');
    expect(html).toContain("Bütün filtrləri sıfırla");
  });

  it("mobil əməl zolağını safe-area ilə sabit saxlayıb desktopda gizlədir", () => {
    const html = renderToStaticMarkup(
      <StickyActionBar>
        <button type="button">Əlaqə saxla</button>
      </StickyActionBar>,
    );

    expect(html).toContain('aria-label="Səhifə əməliyyatları"');
    expect(html).toContain("fixed");
    expect(html).toContain("var(--safe-bottom)");
    expect(html).toContain("lg:hidden");
    expect(html).toContain("Əlaqə saxla");
  });

  it("eyni məlumatı mobil kart və desktop cədvəl təqdimatında render edir", () => {
    const items = [
      { id: "a", title: "Sahil villası" },
      { id: "b", title: "Şəhər mənzili" },
    ];
    const html = renderToStaticMarkup(
      <AdaptiveDataList
        items={items}
        getKey={(item) => item.id}
        renderCard={(item) => <article>{item.title}</article>}
        renderTable={(tableItems) => (
          <table>
            <tbody>
              {tableItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        empty={<p>Nəticə yoxdur</p>}
      />,
    );

    expect(html.match(/Sahil villası/g)).toHaveLength(2);
    expect(html.match(/Şəhər mənzili/g)).toHaveLength(2);
    expect(html).toContain("lg:hidden");
    expect(html).toContain("hidden lg:block");
  });

  it("məlumat olmadıqda yalnız vahid boş vəziyyəti göstərir", () => {
    const html = renderToStaticMarkup(
      <AdaptiveDataList
        items={[] as { id: string }[]}
        getKey={(item) => item.id}
        renderCard={() => <article>Kart render edilməməlidir</article>}
        renderTable={() => <table aria-label="Cədvəl render edilməməlidir" />}
        empty={<p>Nəticə yoxdur</p>}
      />,
    );

    expect(html).toBe("<p>Nəticə yoxdur</p>");
  });
});
