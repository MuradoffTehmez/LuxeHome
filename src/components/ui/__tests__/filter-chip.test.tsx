import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FilterChip, FilterChipRow } from "../filter-chip";

describe("FilterChipRow", () => {
  it("üfüqi sürüşən zolaq mövqe konteksti yaradır (sr-only uşaq sənədi daşdırmasın)", () => {
    const html = renderToStaticMarkup(
      <FilterChipRow label="Kateqoriyalar">
        <FilterChip href="/blog" active>
          Hamısı
        </FilterChip>
      </FilterChipRow>,
    );

    const nav = html.match(/<nav[^>]*class="([^"]*)"/)?.[1].split(/\s+/) ?? [];
    expect(nav).toContain("overflow-x-auto");
    expect(nav).toContain("relative");
    expect(html).toContain('aria-label="Kateqoriyalar"');
  });

  it("aktiv çip aria-current daşıyır və 44 px hədəfdir", () => {
    const html = renderToStaticMarkup(
      <>
        <FilterChip href="/blog" active>
          Hamısı
        </FilterChip>
        <FilterChip href="/blog?kateqoriya=x" active={false}>
          Digər
        </FilterChip>
      </>,
    );

    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    expect(html.match(/min-h-11/g)).toHaveLength(2);
  });
});
