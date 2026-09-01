import { describe, expect, it } from "vitest";
import { parseAiJson } from "../ai";

/**
 * Model çıxışının parse müqaviləsi.
 *
 * Tarixi səbəb: panel «AI cavabında JSON tapılmadı» xətası verirdi. Köhnə kod
 * yalnız ilk `{` ilə **son** `}` arasını götürürdü — model JSON-dan sonra izahat
 * cümləsi yazanda və ya iki blok qaytaranda həmin kəsik sintaksis xətası verirdi.
 * Aşağıdakı hallar həmin regressiyanı bağlayır.
 */

describe("parseAiJson — təmiz cavab", () => {
  it("adi JSON obyektini oxuyur", () => {
    expect(parseAiJson<{ ok: boolean }>('{"ok":true}')).toEqual({ ok: true });
  });

  it("ətrafdakı boşluğu nəzərə almır", () => {
    expect(parseAiJson<{ ok: boolean }>('\n  {"ok": true}  \n')).toEqual({ ok: true });
  });
});

describe("parseAiJson — markdown bloku", () => {
  it("```json bloku içindən oxuyur", () => {
    const text = '```json\n{"description":"Mətn"}\n```';
    expect(parseAiJson<{ description: string }>(text)).toEqual({ description: "Mətn" });
  });

  it("dil etiketi olmayan blokdan oxuyur", () => {
    expect(parseAiJson<{ a: number }>('```\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it("blokdan əvvəl izahat mətni olsa da oxuyur", () => {
    const text = 'Əlbəttə, budur:\n\n```json\n{"a":1}\n```\nUmid edirəm kömək etdi.';
    expect(parseAiJson<{ a: number }>(text)).toEqual({ a: 1 });
  });
});

describe("parseAiJson — sərbəst mətn içində", () => {
  it("JSON-dan sonrakı izahatı kəsir", () => {
    const text = '{"description":"Bakıda mənzil"} Bu təsvir faktlara əsaslanır.';
    expect(parseAiJson<{ description: string }>(text)).toEqual({
      description: "Bakıda mənzil",
    });
  });

  it("iki blok qaytarıldıqda birincini götürür", () => {
    // Köhnə «ilk { … son }» məntiqi burada sintaksis xətası verirdi.
    const text = '{"a":1}\n\n{"b":2}';
    expect(parseAiJson<{ a: number }>(text)).toEqual({ a: 1 });
  });

  it("iç-içə obyektin bağlanışını düzgün tapır", () => {
    const text = 'Nəticə: {"outer":{"inner":{"deep":true}},"n":2} — hazırdır.';
    expect(parseAiJson<{ outer: unknown; n: number }>(text)).toEqual({
      outer: { inner: { deep: true } },
      n: 2,
    });
  });

  it("mətn daxilindəki mötərizə balansı pozmur", () => {
    const text = '{"description":"Qiymət } və { işarəsi mətndədir"}';
    expect(parseAiJson<{ description: string }>(text)).toEqual({
      description: "Qiymət } və { işarəsi mətndədir",
    });
  });

  it("escape edilmiş dırnaq sətri erkən bağlamır", () => {
    const text = '{"description":"O, \\"villa\\" adlanır"}';
    expect(parseAiJson<{ description: string }>(text)).toEqual({
      description: 'O, "villa" adlanır',
    });
  });
});

describe("parseAiJson — massiv", () => {
  it("massiv cavabını oxuyur", () => {
    expect(parseAiJson<number[]>("[1,2,3]")).toEqual([1, 2, 3]);
  });

  it("izahat mətni içindəki massivi tapır", () => {
    expect(parseAiJson<string[]>('Siyahı: ["a","b"] — hamısı budur.')).toEqual(["a", "b"]);
  });
});

describe("parseAiJson — JSON olmayan cavab", () => {
  it("mətndə JSON yoxdursa xəta atır", () => {
    expect(() => parseAiJson("Bağışlayın, kömək edə bilmirəm.")).toThrow(
      "AI cavabında JSON tapılmadı.",
    );
  });

  it("bağlanmamış blok üçün xəta atır", () => {
    expect(() => parseAiJson('{"a":1')).toThrow("AI cavabında JSON tapılmadı.");
  });
});
