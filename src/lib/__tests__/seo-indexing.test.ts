import { describe, expect, it } from "vitest";
import {
  classifyBlogSearchParams,
  classifyPropertySearchParams,
} from "@/lib/seo-indexing";

describe("əmlak faceted index siyasəti", () => {
  it("parametrsiz siyahını self-canonical və indexable edir", () => {
    expect(classifyPropertySearchParams({})).toEqual({
      canonicalPath: "/emlaklar",
      indexPolicy: "index",
      page: 1,
      validPage: true,
    });
  });

  it("yalnız real pagination URL-ni self-canonical edir", () => {
    expect(classifyPropertySearchParams({ sehife: "3" })).toEqual({
      canonicalPath: "/emlaklar?sehife=3",
      indexPolicy: "index",
      page: 3,
      validPage: true,
    });
    expect(classifyPropertySearchParams({ sehife: "1" }).canonicalPath).toBe("/emlaklar");
  });

  it("filter, sort, search, naməlum və təkrarlanan parametrləri noindex edir", () => {
    for (const params of [
      { tip: "villalar" },
      { axtaris: "Nərimanov" },
      { siralama: "price_asc" },
      { utm_fake: "sonsuz" },
      { tip: ["villa", "ofis"] },
    ]) {
      expect(classifyPropertySearchParams(params)).toMatchObject({
        canonicalPath: null,
        indexPolicy: "noindex-follow",
      });
    }
  });

  it("yanlış səhifə dəyərini 404 üçün etibarsız işarələyir", () => {
    expect(classifyPropertySearchParams({ sehife: "0" }).validPage).toBe(false);
    expect(classifyPropertySearchParams({ sehife: "abc" }).validPage).toBe(false);
    expect(classifyPropertySearchParams({ sehife: ["2", "3"] }).validPage).toBe(false);
  });
});

describe("bloq index siyasəti", () => {
  it("yalnız pagination variantını indeksləyir", () => {
    expect(classifyBlogSearchParams({ sehife: "2" })).toMatchObject({
      canonicalPath: "/blog?sehife=2",
      indexPolicy: "index",
      page: 2,
      validPage: true,
    });
  });

  it("kateqoriya və naməlum parametri canonical-sız noindex edir", () => {
    expect(classifyBlogSearchParams({ kateqoriya: "beledci" })).toMatchObject({
      canonicalPath: null,
      indexPolicy: "noindex-follow",
    });
    expect(classifyBlogSearchParams({ foo: "bar" }).indexPolicy).toBe("noindex-follow");
  });
});
