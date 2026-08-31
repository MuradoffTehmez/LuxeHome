import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const roots = [
  join(process.cwd(), "src", "app", "[locale]"),
  join(process.cwd(), "src", "components", "site"),
  join(process.cwd(), "src", "components", "ui"),
];

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === "__tests__" ? [] : sourceFiles(path);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

function withoutComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

describe("public i18n source audit", () => {
  it("lokallaşdırılmış ağacda görünən AZ/RU JSX literalı saxlamır", () => {
    const findings: string[] = [];
    const localizedCharacters = "ƏəİıÖöÜüĞğŞşÇç\\u0400-\\u04FF";
    const localizedAttribute = new RegExp(
      `(?:aria-label|title|placeholder|label|description|confirmLabel|cancelLabel|alt)=["'][^"']*[${localizedCharacters}][^"']*["']`,
      "g",
    );
    const localizedTextNode = new RegExp(`>[^<>{}\\r\\n]*[${localizedCharacters}][^<>{}\\r\\n]*<`, "g");

    for (const file of roots.flatMap(sourceFiles)) {
      const source = withoutComments(readFileSync(file, "utf8"));
      for (const match of [...source.matchAll(localizedAttribute), ...source.matchAll(localizedTextNode)]) {
        findings.push(`${file.replace(process.cwd(), "")}: ${match[0]}`);
      }
    }

    expect(findings).toEqual([]);
  });

  it("AZ domen label sabitlərini lokallaşdırılmış UI-da birbaşa göstərmir", () => {
    const forbidden = /\b(?:LISTING_TYPE|RENOVATION|DOCUMENT_STATUS|BUILDING_TYPE|RESERVATION_STATUS|LEGAL_CONTENT_STATUS|KNOWLEDGE_RISK_LEVEL)_LABELS\b/;
    const findings = roots
      .flatMap(sourceFiles)
      .filter((file) => forbidden.test(withoutComments(readFileSync(file, "utf8"))));

    expect(findings).toEqual([]);
  });
});
