/**
 * Kiçik RFC 4180 CSV oxuyucusu (toplu elan idxalı, #103).
 *
 * Excel-in Azərbaycan/Rusiya regional ayarları sütunları vergüllə deyil, nöqtəli
 * vergüllə ayırır; ona görə ayırıcı başlıq sətrindən avtomatik seçilir. Dırnaq içində
 * vergül, sətir keçidi və ikiqat dırnaq (`""`) dəstəklənir, UTF-8 BOM atılır.
 */

export type CsvDelimiter = "," | ";" | "\t";

/** Başlıq sətrində (dırnaqdan kənarda) ən çox rast gələn ayırıcı. */
export function detectDelimiter(text: string): CsvDelimiter {
  const counts: Record<CsvDelimiter, number> = { ",": 0, ";": 0, "\t": 0 };
  let quoted = false;
  for (const char of text) {
    if (char === "\"") quoted = !quoted;
    else if (!quoted && (char === "\n" || char === "\r")) break;
    else if (!quoted && char in counts) counts[char as CsvDelimiter] += 1;
  }
  const [best, count] = (Object.entries(counts) as [CsvDelimiter, number][])
    .sort((left, right) => right[1] - left[1])[0];
  return count > 0 ? best : ",";
}

export function parseCsv(input: string, delimiter: CsvDelimiter = detectDelimiter(input.replace(/^﻿/, ""))): string[][] {
  const text = input.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === "\"") {
        if (text[index + 1] === "\"") {
          field += "\"";
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === "\"" && field === "") {
      quoted = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  // Tamamilə boş sətirlər (faylın sonundakı və ya aralıqdakı) atılır.
  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
}

/** CSV hüceyrəsini yazır — şablon faylı üçün. */
export function csvCell(value: string, delimiter: CsvDelimiter = ","): string {
  return /["\n\r]/.test(value) || value.includes(delimiter) ? `"${value.replace(/"/g, "\"\"")}"` : value;
}
