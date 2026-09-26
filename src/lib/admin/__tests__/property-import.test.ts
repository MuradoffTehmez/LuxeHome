import { describe, expect, it } from "vitest";
import { csvCell, detectDelimiter, parseCsv } from "@/lib/admin/csv";
import { IMPORT_MAX_ROWS, importRowKey, mapImportRows, parseImportNumber, type ImportLookups } from "@/lib/admin/property-import";

const lookups: ImportLookups = {
  types: [{ id: "ckt0000000000000000000001", slug: "menziller", name: "Mənzillər" }],
  locations: [
    { id: "ckc0000000000000000000001", slug: "baki", name: "Bakı", kind: "CITY", parentId: null, parent: null },
    { id: "ckd0000000000000000000001", slug: "baki-nerimanov", name: "Nərimanov", kind: "DISTRICT", parentId: "ckc0000000000000000000001", parent: { parentId: null } },
    { id: "cks0000000000000000000001", slug: "baki-mastaga", name: "Maştağa", kind: "SETTLEMENT", parentId: "ckd0000000000000000000001", parent: { parentId: "ckc0000000000000000000001" } },
    { id: "ckm0000000000000000000001", slug: "baki-metro-28-may", name: "28 May", kind: "METRO", parentId: "ckc0000000000000000000001", parent: { parentId: null } },
  ],
  features: [{ id: "ckf0000000000000000000001", slug: "lift", name: "Lift" }],
};

const HEADER = "title;description;listing_type;price;currency;type;city;district;metro;rooms;area;features;images";

describe("CSV oxuyucusu", () => {
  it("nöqtəli vergül ayırıcını tapır, BOM və dırnaqlı hüceyrələri oxuyur", () => {
    const text = "﻿a;b;c\r\n\"x; y\";\"line\nbreak\";\"say \"\"hi\"\"\"\n\n";
    expect(detectDelimiter(text.slice(1))).toBe(";");
    expect(parseCsv(text)).toEqual([["a", "b", "c"], ["x; y", "line\nbreak", "say \"hi\""]]);
  });

  it("şablon hüceyrəsini lazım olanda dırnağa alır", () => {
    expect(csvCell("sadə")).toBe("sadə");
    expect(csvCell("a,b")).toBe("\"a,b\"");
    expect(csvCell("\"x\"")).toBe("\"\"\"x\"\"\"");
  });
});

describe("parseImportNumber", () => {
  it("minlik və onluq yazılışlarını ayırd edir", () => {
    expect(parseImportNumber("350 000")).toBe(350000);
    expect(parseImportNumber("350,000")).toBe(350000);
    expect(parseImportNumber("85,5")).toBe(85.5);
    expect(parseImportNumber("1.250.000")).toBe(1250000);
    expect(parseImportNumber("185.000")).toBe(185000);
    expect(parseImportNumber("85.5")).toBe(85.5);
    expect(parseImportNumber("1.250,75")).toBe(1250.75);
    expect(parseImportNumber("")).toBeNull();
    expect(parseImportNumber("abc")).toBeNaN();
  });
});

describe("mapImportRows", () => {
  const row = (cells: string) => parseCsv(`${HEADER}\n${cells}`);

  it("etiket və adları (diakritiksiz də) tapıb qaralama elan qurur", () => {
    const result = mapImportRows(
      row("Nərimanovda 3 otaqlı mənzil;Metroya yaxın, təmirli, sənədli mənzil satılır.;satış;185 000;;Menziller;baki;Masdaga;28 May;3;95,5;lift;https://example.com/a.jpg|https://example.com/b.jpg"),
      lookups,
    );
    // «Masdaga» — yazı səhvi, tapılmamalıdır.
    expect(result.rows[0].errors).toEqual([{ code: "notFound", field: "district", value: "Masdaga" }]);

    const ok = mapImportRows(
      row("Nərimanovda 3 otaqlı mənzil;Metroya yaxın, təmirli, sənədli mənzil satılır.;satış;185 000;;Menziller;baki;Mastaga;28 May;3;95,5;lift;https://example.com/a.jpg|https://example.com/b.jpg"),
      lookups,
    ).rows[0];
    expect(ok.errors).toEqual([]);
    expect(ok.input).toMatchObject({
      status: "DRAFT",
      listingType: "SALE",
      price: 185000,
      currency: "AZN",
      typeId: "ckt0000000000000000000001",
      districtId: "cks0000000000000000000001",
      metroId: "ckm0000000000000000000001",
      area: 95.5,
      featureIds: ["ckf0000000000000000000001"],
    });
    expect(ok.images).toHaveLength(2);
    expect(ok.line).toBe(2);
  });

  it("başqa şəhərə aid metronu qəbul etmir", () => {
    const withGanja: ImportLookups = {
      ...lookups,
      locations: [...lookups.locations, { id: "ckc0000000000000000000002", slug: "gence", name: "Gəncə", kind: "CITY", parentId: null, parent: null }],
    };
    const result = mapImportRows(row("Gəncədə 2 otaqlı mənzil satılır;Mərkəzdə, təmirli mənzil satılır. Test sətri.;SALE;90000;;menziller;Gəncə;;28 May;2;60;;"), withGanja);
    expect(result.rows[0].errors).toEqual([{ code: "notFound", field: "metro", value: "28 May" }]);
  });

  it("kirayədə dövr verilməyibsə aylıq götürür", () => {
    const result = mapImportRows(row("Kirayə mənzil Nərimanovda;Uzunmüddətli kirayə üçün mebelli mənzil.;RENT;900;AZN;menziller;Bakı;;;2;60;;"), lookups);
    expect(result.rows[0].input?.pricePeriod).toBe("MONTH");
  });

  it("çatışmayan məcburi sütunu və sətir limitini bildirir", () => {
    expect(mapImportRows([["title", "price"]], lookups).headerErrors.map((issue) => issue.field)).toContain("description");
    const many = [HEADER.split(";"), ...Array.from({ length: IMPORT_MAX_ROWS + 1 }, () => ["x"])];
    expect(mapImportRows(many, lookups).headerErrors[0].code).toBe("tooManyRows");
  });

  it("sxem xətasını sütun adı ilə, http şəkli və tanınmayan dəyəri ayrıca göstərir", () => {
    const result = mapImportRows(row("Qısa;az;hədiyyə;-5;;menziller;baki;;;;;;http://insecure.example/a.jpg"), lookups).rows[0];
    const fields = result.errors.map((issue) => `${issue.code}:${issue.field}`);
    expect(fields).toEqual(expect.arrayContaining(["invalidValue:listing_type", "invalidImageUrl:images", "schema:title", "schema:description", "schema:price"]));
    expect(result.input).toBeNull();
  });

  it("idxal açarı eyni sətir üçün sabitdir, məzmun dəyişəndə dəyişir", async () => {
    const line = "Kirayə mənzil Nərimanovda;Uzunmüddətli kirayə üçün mebelli mənzil.;RENT;900;AZN;menziller;Bakı;;;2;60;;";
    const first = mapImportRows(row(line), lookups).rows[0];
    const again = mapImportRows(row(line), lookups).rows[0];
    const changed = mapImportRows(row(line.replace(";900;", ";950;")), lookups).rows[0];
    const key = await importRowKey(first);
    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(await importRowKey(again)).toBe(key);
    expect(await importRowKey(changed)).not.toBe(key);
    expect(await importRowKey({ input: null, images: [] })).toBeNull();
  });
});
