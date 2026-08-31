import { describe, expect, it } from "vitest";

import * as constants from "@/lib/constants";
import azAdmin from "../locales/az/admin.json";

/**
 * `constants.ts`-dəki `*_LABELS` dəstləri ilə `admin.json`-dakı `labels` bölməsi
 * eyni məlumatı daşıyır: sabitlər domen qatının (və ictimai saytın) mənbəyidir,
 * kataloq isə panelin dilə görə göstərdiyi mətndir.
 *
 * Bu test ikisinin sürüşməsinin qarşısını alır — sabitə yeni status əlavə edilib
 * kataloq unudularsa, panel həmin sətirdə açar adını göstərərdi.
 */

/** `FOO_BAR_LABELS` -> `fooBar` */
function toCamel(name: string): string {
  return name
    .replace(/_LABELS$/, "")
    .toLowerCase()
    .replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

const labelSets = Object.entries(constants)
  .filter(
    (entry): entry is [string, Record<string, string>] =>
      entry[0].endsWith("_LABELS") &&
      typeof entry[1] === "object" &&
      entry[1] !== null &&
      Object.values(entry[1] as Record<string, unknown>).every((v) => typeof v === "string"),
  )
  .map(([name, value]) => [name, toCamel(name), value] as const);

const catalog = azAdmin.labels as unknown as Record<string, Record<string, string>>;

describe("admin label catalog", () => {
  it("covers every label set declared in constants", () => {
    const expected = labelSets.map(([, camel]) => camel).sort();
    expect(Object.keys(catalog).sort()).toEqual(expected);
  });

  it.each(labelSets.map(([name, camel]) => [name, camel]))(
    "keeps %s in sync with labels.%s",
    (name, camel) => {
      const source = labelSets.find(([n]) => n === name)![2];
      expect(Object.keys(catalog[camel]).sort()).toEqual(Object.keys(source).sort());
      // AZ kataloqu mənbə dildir — mətnlər hərfi hərfinə eyni olmalıdır
      expect(catalog[camel]).toEqual(source);
    },
  );
});
