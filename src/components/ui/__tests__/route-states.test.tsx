import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CollectionPageSkeleton,
  DetailSkeleton,
  ErrorState,
} from "../states";

describe("route vəziyyətləri", () => {
  it("kolleksiya skeleton-u başlıq və real üç sütunlu kart ritmini saxlayır", () => {
    const html = renderToStaticMarkup(<CollectionPageSkeleton cards={3} variant="article" />);

    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("xl:grid-cols-3");
    expect(html.match(/aspect-16\/10/g)).toHaveLength(3);
  });

  it("detal skeleton-u overflow-safe əsas və sticky yan sütun yaradır", () => {
    const html = renderToStaticMarkup(<DetailSkeleton />);

    expect(html).toContain("lg:grid-cols-[minmax(0,1fr)_380px]");
    expect(html).toContain("min-w-0");
    expect(html).toContain("lg:sticky");
    expect(html).toContain("lg:top-28");
  });

  it("xəta vəziyyətində təkrar cəhd və əlaqə yollarını birlikdə göstərir", () => {
    const html = renderToStaticMarkup(<ErrorState onRetry={() => undefined} />);

    expect(html).toContain("Yenidən cəhd et");
    expect(html).toContain('href="/elaqe"');
  });

  it.each([
    "src/app/[locale]/(account)/kabinet/loading.tsx",
    "src/app/admin/loading.tsx",
    "src/app/[locale]/giris/loading.tsx",
  ])("%s segment səviyyəli accessible loading vəziyyətini saxlayır", (file) => {
    const source = readFileSync(join(process.cwd(), file), "utf8");
    expect(source).toContain('role="status"');
    expect(source).toContain('aria-busy="true"');
  });

  it("ictimai segment ümumi kolleksiya skeleton-undan istifadə edir", () => {
    const source = readFileSync(join(process.cwd(), "src/app/[locale]/(site)/loading.tsx"), "utf8");
    expect(source).toContain("CollectionPageSkeleton");
  });
});
