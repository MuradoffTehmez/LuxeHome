import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const roots = [
  join(process.cwd(), "src", "app", "admin"),
  join(process.cwd(), "src", "components", "admin"),
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

describe("admin i18n source audit", () => {
  it("üçdilli admin UI-da görünən Azərbaycan/Rus JSX literalı saxlamır", () => {
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

  it("sayğac və məlum əməliyyat mətnlərini JSX-də hardcode etmir", () => {
    const forbidden = /(?:Zibil qutusu|Deaktiv et|IP yoxdur|aktiv sessiya|audit qeydi|\}\s+(?:qeyd|problem|asset|alert|link|chain|entity))\b/;
    const findings = roots.flatMap(sourceFiles).filter((file) => file.endsWith(".tsx")).filter((file) =>
      forbidden.test(withoutComments(readFileSync(file, "utf8"))),
    );

    expect(findings).toEqual([]);
  });
});
