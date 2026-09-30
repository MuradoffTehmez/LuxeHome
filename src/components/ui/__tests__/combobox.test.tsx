import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import { Combobox, filterComboboxOptions, type ComboboxOption } from "../combobox";
import { Select, SEARCHABLE_MIN_OPTIONS } from "../field";
import { comboboxMessages } from "@/i18n/combobox-messages";

const CITIES: ComboboxOption[] = [
  { value: "baki", label: "Bakı" },
  { value: "seki", label: "Şəki" },
  { value: "qebele", label: "Qəbələ" },
  { value: "sumqayit", label: "Sumqayıt" },
  { value: "qazax", label: "Qazax", description: "Qazax-Tovuz iqtisadi rayonu" },
];

function render(node: React.ReactNode, locale = "az") {
  return renderToStaticMarkup(
    <NextIntlClientProvider locale={locale} messages={{}}>
      {node}
    </NextIntlClientProvider>,
  );
}

describe("filterComboboxOptions", () => {
  it("diakritikadan asılı olmayan axtarış edir", () => {
    expect(filterComboboxOptions(CITIES, "seki").map((o) => o.value)).toEqual(["seki"]);
    expect(filterComboboxOptions(CITIES, "ŞƏKİ").map((o) => o.value)).toEqual(["seki"]);
    expect(filterComboboxOptions(CITIES, "baki").map((o) => o.value)).toEqual(["baki"]);
  });

  it("tam uyğunluq, sonra sözün əvvəli, sonra daxildə keçənlər gəlir", () => {
    const options: ComboboxOption[] = [
      { value: "1", label: "Yeni Günəşli" },
      { value: "2", label: "Günəşli" },
      { value: "3", label: "Günəşlilər küçəsi" },
    ];
    expect(filterComboboxOptions(options, "gunesli").map((o) => o.value)).toEqual(["2", "1", "3"]);
  });

  it("təsvir mətnində də axtarır, boş sorğu bütün siyahını qaytarır", () => {
    expect(filterComboboxOptions(CITIES, "tovuz").map((o) => o.value)).toEqual(["qazax"]);
    expect(filterComboboxOptions(CITIES, "  ")).toHaveLength(CITIES.length);
  });
});

describe("Combobox", () => {
  it("ARIA combobox nümunəsini və etiket bağlantısını qurur", () => {
    const html = render(<Combobox label="Şəhər" name="cityId" options={CITIES} required defaultValue="seki" />);
    const id = html.match(/role="combobox"[^>]*id="([^"]+)"|id="([^"]+)"[^>]*role="combobox"/);
    expect(html).toContain('role="combobox"');
    expect(html).toContain('aria-autocomplete="list"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toMatch(/aria-controls="[^"]+-list"/);
    expect(id).toBeTruthy();
    // Forma gizli sahədə variantın dəyərini, görünən sahə isə etiketini daşıyır.
    expect(html).toMatch(/<input type="hidden" name="cityId" value="seki"\/>/);
    expect(html).toContain('value="Şəki"');
    expect(html).toContain("required");
  });

  it("sərbəst rejimdə yazılmış mətni dəyər kimi saxlayır", () => {
    const html = render(
      <Combobox mode="free" allowCreate label="Küçə" name="street" options={[]} defaultValue="Nizami küçəsi" />,
    );
    expect(html).toMatch(/<input type="hidden" name="street" value="Nizami küçəsi"\/>/);
    expect(html).toContain('value="Nizami küçəsi"');
  });

  it("xəta mətnini sahəyə bağlayır", () => {
    const html = render(<Combobox label="Şəhər" name="cityId" options={CITIES} error="Şəhər seçin" id="city" />);
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby="city-error"');
    expect(html).toContain("Şəhər seçin");
  });

  it("deaktiv vəziyyətdə sahə və düymələr bağlıdır", () => {
    const html = render(<Combobox label="Ölkə" options={[{ value: "AZ", label: "Azərbaycan" }]} value="AZ" disabled clearable={false} />);
    expect(html).toMatch(/role="combobox"[^>]*disabled=""/);
    expect(html).not.toContain('aria-label="Seçimi təmizlə"');
  });
});

describe("Select", () => {
  const many = Array.from({ length: SEARCHABLE_MIN_OPTIONS }, (_, index) => ({ value: String(index), label: `Variant ${index}` }));

  it("uzun siyahıda axtarışlı ComboBox, qısa siyahıda native select göstərir", () => {
    expect(render(<Select label="Növ" name="typeId" options={many} />)).toContain('role="combobox"');
    expect(render(<Select label="Növ" name="typeId" options={many.slice(0, 3)} />)).toContain("<select");
    expect(render(<Select label="Növ" name="typeId" options={many.slice(0, 3)} searchable />)).toContain('role="combobox"');
  });
});

describe("combobox-messages", () => {
  it("üç dil eyni açarları daşıyır və naməlum dil AZ-a düşür", () => {
    const keys = (locale: string) => Object.keys(comboboxMessages(locale)).sort();
    expect(keys("en")).toEqual(keys("az"));
    expect(keys("ru")).toEqual(keys("az"));
    expect(comboboxMessages("fr")).toBe(comboboxMessages("az"));
    expect(comboboxMessages("en").create("Test")).toContain("Test");
  });
});
