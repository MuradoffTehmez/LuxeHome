/**
 * Lokal SQLite faylını (prisma/dev.db) D1-ə yüklənə bilən SQL faylına çevirir.
 *
 * Axın:  prisma db push → tsx prisma/seed.ts → bu script → wrangler d1 execute --file
 *
 * Cədvəllər xarici açar asılılığına görə topoloji sıralanır, çünki D1 foreign key
 * məhdudiyyətlərini tətbiq edir və valideyn sətir uşaqdan əvvəl yazılmalıdır.
 */
import { DatabaseSync } from "node:sqlite";
import { writeFileSync } from "node:fs";
import path from "node:path";

const DB_PATH = path.join(import.meta.dirname, "dev.db");
const OUT_PATH = path.join(import.meta.dirname, "seed.sql");

const db = new DatabaseSync(DB_PATH, { readOnly: true });

const tables = db
  .prepare(
    `SELECT name FROM sqlite_master
     WHERE type = 'table'
       AND name NOT LIKE 'sqlite_%'
       AND name NOT LIKE '_prisma_%'
     ORDER BY name`,
  )
  .all()
  .map((row) => String(row.name));

/** Hər cədvəlin asılı olduğu valideyn cədvəllər. */
const parentsOf = new Map<string, string[]>();
for (const table of tables) {
  const fks = db.prepare(`PRAGMA foreign_key_list("${table}")`).all();
  const parents = [...new Set(fks.map((fk) => String(fk.table)))].filter(
    (parent) => parent !== table && tables.includes(parent),
  );
  parentsOf.set(table, parents);
}

/** Topoloji sıralama — valideyn əvvəl. */
const ordered: string[] = [];
const visiting = new Set<string>();
function visit(table: string) {
  if (ordered.includes(table) || visiting.has(table)) return;
  visiting.add(table);
  for (const parent of parentsOf.get(table) ?? []) visit(parent);
  visiting.delete(table);
  ordered.push(table);
}
for (const table of tables) visit(table);

function literal(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  if (typeof value === "bigint") return String(value);
  if (value instanceof Uint8Array) {
    return `X'${Buffer.from(value).toString("hex")}'`;
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

const lines: string[] = [
  "-- Luxe Home Estate — D1 seed məlumatı",
  "-- Avtomatik yaradılıb: npm run db:seed:build",
  "",
];

// Təkrar icra zamanı köhnə məlumatı təmizlə (uşaqdan valideynə doğru).
for (const table of [...ordered].reverse()) {
  lines.push(`DELETE FROM "${table}";`);
}
lines.push("");

let rowCount = 0;
for (const table of ordered) {
  const rows = db.prepare(`SELECT * FROM "${table}"`).all();
  if (rows.length === 0) continue;

  const columns = Object.keys(rows[0]);
  lines.push(`-- ${table} (${rows.length})`);
  for (const row of rows) {
    const values = columns.map((column) => literal(row[column])).join(", ");
    lines.push(
      `INSERT INTO "${table}" (${columns.map((c) => `"${c}"`).join(", ")}) VALUES (${values});`,
    );
    rowCount++;
  }
  lines.push("");
}

writeFileSync(OUT_PATH, lines.join("\n"), "utf8");
db.close();

console.log(`✓ ${OUT_PATH}`);
console.log(`  Cədvəl sırası: ${ordered.join(" → ")}`);
console.log(`  Sətir sayı: ${rowCount}`);
