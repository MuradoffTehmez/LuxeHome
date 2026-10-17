/**
 * Asılılıqsız hesabat formatları (#238, PRD 11.6): CSV və minimal XLSX (Office Open XML).
 *
 * XLSX — ZIP arxivində bir neçə XML faylıdır. Workers-də kitabxana yükləmək əvəzinə hissələr
 * sıxılmadan («stored», metod 0) yazılır: Excel, LibreOffice və Google Sheets bunu oxuyur, CRC32
 * isə hər hissə üçün hesablanır. Mətn xanaları `inlineStr`-dir (paylaşılan sətir cədvəli lazım deyil).
 */

export type Cell = string | number | null | undefined;
export type Sheet = { name: string; rows: Cell[][] };

const csvCell = (value: Cell) => {
  if (value == null) return "";
  const text = String(value);
  // Formula inyeksiyasına qarşı: `=`, `+`, `-`, `@` ilə başlayan mətn Excel-də düstur kimi işləyərdi.
  const safe = typeof value === "string" && /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /[",\n\r;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

/** Bir və ya bir neçə bölmə; bölmələr arasında boş sətir və başlıq sətri. BOM — Excel UTF-8-i tanısın. */
export function toCsv(sheets: Sheet[]): string {
  const blocks = sheets.map((sheet) => [sheets.length > 1 ? csvCell(sheet.name) : null, ...sheet.rows.map((row) => row.map(csvCell).join(","))].filter((line): line is string => line !== null).join("\r\n"));
  return `﻿${blocks.join("\r\n\r\n")}\r\n`;
}

const xml = (value: string) =>
  value.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char] ?? char)
    // XML 1.0-da icazəsiz idarəetmə simvolları atılır.
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");

function column(index: number): string {
  let name = "";
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
  return name;
}

function sheetXml(rows: Cell[][]): string {
  const body = rows.map((row, r) => {
    const cells = row.map((value, c) => {
      const ref = `${column(c)}${r + 1}`;
      if (value == null || value === "") return "";
      if (typeof value === "number" && Number.isFinite(value)) return `<c r="${ref}"><v>${value}</v></c>`;
      return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xml(String(value))}</t></is></c>`;
    }).join("");
    return `<row r="${r + 1}">${cells}</row>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${body}</sheetData></worksheet>`;
}

/** Excel vərəq adı: ən çox 31 simvol, `[]:*?/\` olmadan, unikal. */
function sheetNames(sheets: Sheet[]): string[] {
  const used = new Set<string>();
  return sheets.map((sheet, index) => {
    let name = sheet.name.replace(/[[\]:*?/\\]/g, " ").trim().slice(0, 31) || `Sheet${index + 1}`;
    while (used.has(name)) name = `${name.slice(0, 28)} ${index + 1}`;
    used.add(name);
    return name;
  });
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/** Sıxılmamış ZIP arxivi. */
export function zipStored(files: { path: string; data: Uint8Array }[]): Uint8Array {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const file of files) {
    const name = encoder.encode(file.path);
    const crc = crc32(file.data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // UTF-8 adlar
    local.setUint16(8, 0, true); // stored
    local.setUint32(14, crc, true);
    local.setUint32(18, file.data.length, true);
    local.setUint32(22, file.data.length, true);
    local.setUint16(26, name.length, true);
    chunks.push(new Uint8Array(local.buffer), name, file.data);

    const entry = new DataView(new ArrayBuffer(46));
    entry.setUint32(0, 0x02014b50, true);
    entry.setUint16(4, 20, true);
    entry.setUint16(6, 20, true);
    entry.setUint16(8, 0x0800, true);
    entry.setUint32(16, crc, true);
    entry.setUint32(20, file.data.length, true);
    entry.setUint32(24, file.data.length, true);
    entry.setUint16(28, name.length, true);
    entry.setUint32(42, offset, true);
    central.push(new Uint8Array(entry.buffer), name);
    offset += 30 + name.length + file.data.length;
  }
  const centralSize = central.reduce((sum, part) => sum + part.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);
  const parts = [...chunks, ...central, new Uint8Array(end.buffer)];
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let cursor = 0;
  for (const part of parts) {
    out.set(part, cursor);
    cursor += part.length;
  }
  return out;
}

export function toXlsx(sheets: Sheet[]): Uint8Array {
  const encoder = new TextEncoder();
  const names = sheetNames(sheets);
  const files = [
    {
      path: "[Content_Types].xml",
      text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${names.map((_, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`,
    },
    {
      path: "_rels/.rels",
      text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    },
    {
      path: "xl/workbook.xml",
      text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${names.map((name, index) => `<sheet name="${xml(name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join("")}</sheets></workbook>`,
    },
    {
      path: "xl/_rels/workbook.xml.rels",
      text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${names.map((_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join("")}</Relationships>`,
    },
    ...sheets.map((sheet, index) => ({ path: `xl/worksheets/sheet${index + 1}.xml`, text: sheetXml(sheet.rows) })),
  ];
  return zipStored(files.map((file) => ({ path: file.path, data: encoder.encode(file.text) })));
}

export const EXPORT_FORMATS = ["csv", "xlsx"] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export function isExportFormat(value: unknown): value is ExportFormat {
  return typeof value === "string" && (EXPORT_FORMATS as readonly string[]).includes(value);
}

/** Endpoint cavabı: yükləmə başlıqları, `no-store` (şəxsi məlumat keşə düşməsin). */
export function exportResponse(sheets: Sheet[], format: ExportFormat, baseName: string): Response {
  const filename = `${baseName}.${format}`;
  const body = format === "csv" ? toCsv(sheets) : toXlsx(sheets);
  return new Response(body as BodyInit, {
    headers: {
      "Content-Type": format === "csv" ? "text/csv; charset=utf-8" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
