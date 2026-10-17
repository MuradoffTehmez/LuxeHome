import { describe, expect, it } from "vitest";
import { crc32, exportResponse, toCsv, toXlsx, zipStored } from "../tabular";

/** Asılılıqsız CSV/XLSX yazıcıları (#238, PRD 11.6). */

/** Sıxılmamış ZIP-i oxuyur (test üçün): yol → mətn. */
function readZip(bytes: Uint8Array): Map<string, string> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const files = new Map<string, string>();
  let offset = 0;
  const decoder = new TextDecoder();
  while (view.getUint32(offset, true) === 0x04034b50) {
    const size = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const name = decoder.decode(bytes.subarray(offset + 30, offset + 30 + nameLength));
    const start = offset + 30 + nameLength;
    const data = bytes.subarray(start, start + size);
    expect(view.getUint32(offset + 14, true)).toBe(crc32(data));
    files.set(name, decoder.decode(data));
    offset = start + size;
  }
  return files;
}

describe("CSV", () => {
  it("BOM, qaçış və düstur inyeksiyasına qarşı qoruma", () => {
    const csv = toCsv([{ name: "A", rows: [["Ad", "Say"], ['Bakı, "Yasamal"', 12], ["=HYPERLINK(1)", -5], [null, 0]] }]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toContain('"Bakı, ""Yasamal""",12');
    expect(csv).toContain("'=HYPERLINK(1),-5");
    expect(csv).toContain(",0");
  });

  it("bir neçə bölmə başlıqla və boş sətirlə ayrılır", () => {
    expect(toCsv([{ name: "Bir", rows: [["x"]] }, { name: "İki", rows: [["y"]] }])).toBe("﻿Bir\r\nx\r\n\r\nİki\r\ny\r\n");
  });
});

describe("XLSX", () => {
  it("CRC32 standart nümunəyə uyğundur", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
  });

  it("ZIP quruluşu və OOXML hissələri; rəqəm rəqəm, mətn inlineStr", () => {
    const bytes = toXlsx([{ name: "Agentlər/2026", rows: [["Ad", "Müraciət"], ["Aysel <A&B>", 7]] }, { name: "Ərazilər", rows: [["Yasamal", 3]] }]);
    const view = new DataView(bytes.buffer);
    expect(view.getUint32(bytes.length - 22, true)).toBe(0x06054b50);
    const files = readZip(bytes);
    expect([...files.keys()]).toEqual([
      "[Content_Types].xml", "_rels/.rels", "xl/workbook.xml", "xl/_rels/workbook.xml.rels", "xl/worksheets/sheet1.xml", "xl/worksheets/sheet2.xml",
    ]);
    // Vərəq adında icazəsiz `/` atılır.
    expect(files.get("xl/workbook.xml")).toContain('name="Agentlər 2026"');
    const sheet = files.get("xl/worksheets/sheet1.xml") ?? "";
    expect(sheet).toContain('<c r="B2"><v>7</v></c>');
    expect(sheet).toContain("Aysel &lt;A&amp;B&gt;");
  });

  it("boş arxiv də düzgün son qeyd yazır", () => {
    const bytes = zipStored([]);
    expect(bytes.length).toBe(22);
  });

  it("cavab başlıqları: yükləmə və no-store", async () => {
    const response = exportResponse([{ name: "A", rows: [["x"]] }], "xlsx", "hesabat");
    expect(response.headers.get("Content-Disposition")).toBe('attachment; filename="hesabat.xlsx"');
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(new Uint8Array(await response.arrayBuffer()).subarray(0, 2)).toEqual(new Uint8Array([0x50, 0x4b]));
  });
});
