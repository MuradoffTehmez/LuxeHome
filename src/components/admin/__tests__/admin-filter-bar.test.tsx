import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AdminFilterBar } from "../admin-filter-bar";

describe("AdminFilterBar", () => {
  it("mobil filtr drawer-i və desktop GET formasını eyni URL müqaviləsi ilə təqdim edir", () => {
    const html = renderToStaticMarkup(
      <AdminFilterBar
        action="/admin/emlaklar"
        searchName="axtaris"
        searchValue="villa"
        searchPlaceholder="Elan axtar"
        hidden={{ sehife: "2" }}
        resultLabel="12 nəticə"
        selects={[
          {
            name: "status",
            label: "Status",
            value: "ACTIVE",
            options: [
              { value: "", label: "Bütün statuslar" },
              { value: "ACTIVE", label: "Aktiv" },
            ],
          },
        ]}
      />,
    );

    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain("min-h-11");
    expect(html).toContain("lg:hidden");
    expect(html).toContain("hidden lg:block");
    expect(html).toContain('action="/admin/emlaklar"');
    expect(html).toContain('method="get"');
    expect(html).toContain('name="axtaris"');
    expect(html).toContain('name="status"');
    expect(html).toContain('name="sehife"');
  });
});
