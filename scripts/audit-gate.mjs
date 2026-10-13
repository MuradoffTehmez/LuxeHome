#!/usr/bin/env node
/**
 * Asılılıq auditi qapısı — `npm audit --audit-level=high`-in yerinə CI-də işləyir.
 *
 * Fərq yalnız birdir: yamağı hələ olmayan advisory `audit-allowlist.json`-da səbəbi və
 * **bitmə tarixi** ilə yazılıbsa, qapını saxlamır. Siyahıdan kənar hər high/critical
 * advisory, eləcə də müddəti bitmiş istisna qapını yıxır — istisna unudulub əbədi qala
 * bilməz. `--omit=dev` qəsdən işlədilmir: bütün dev asılılıqlarını görməzdən gəlmək
 * qapını bir advisory üçün tamamilə zəiflədərdi.
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const BLOCKING = new Set(["high", "critical"]);

/** `https://github.com/advisories/GHSA-xxxx` → `GHSA-xxxx`. */
export function advisoryId(url) {
  const match = /GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}/i.exec(url ?? "");
  return match ? match[0] : null;
}

/**
 * `npm audit --json` hesabatından qapı qərarı. Yalnız advisory obyektləri (`via`-dakı
 * obyektlər) qiymətləndirilir: sətir `via` başqa paketin zəifliyini miras alır və o
 * paketin öz advisory-si ilə birlikdə qərar verilir.
 */
export function evaluateAudit(report, allowlist, now = new Date()) {
  const blocking = [];
  const allowed = [];
  const expired = [];
  const seen = new Set();
  const entries = new Map(allowlist.map((entry) => [entry.id, entry]));

  for (const vulnerability of Object.values(report.vulnerabilities ?? {})) {
    for (const source of vulnerability.via ?? []) {
      if (typeof source === "string" || !BLOCKING.has(source.severity)) continue;
      const id = advisoryId(source.url) ?? `${source.name}:${source.title}`;
      if (seen.has(id)) continue;
      seen.add(id);
      const finding = { id, package: source.name, severity: source.severity, title: source.title };
      const entry = entries.get(id);
      if (!entry) blocking.push(finding);
      else if (new Date(`${entry.expires}T23:59:59Z`).getTime() < now.getTime()) expired.push({ ...finding, expires: entry.expires });
      else allowed.push({ ...finding, expires: entry.expires, reason: entry.reason });
    }
  }
  return { ok: blocking.length === 0 && expired.length === 0, blocking, allowed, expired };
}

function runAudit() {
  try {
    // Sabit əmr sətri — istifadəçi girişi yoxdur; Windows-da `npm.cmd` də belə tapılır.
    return execSync("npm audit --json", { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  } catch (error) {
    // `npm audit` zəiflik tapanda sıfırdan fərqli kodla çıxır — JSON yenə stdout-dadır.
    if (error.stdout) return error.stdout;
    throw error;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const report = JSON.parse(runAudit());
  const allowlist = JSON.parse(readFileSync(new URL("../audit-allowlist.json", import.meta.url), "utf8"));
  const result = evaluateAudit(report, allowlist);
  for (const item of result.allowed) {
    console.log(`istisna: ${item.id} (${item.package}, ${item.severity}) — ${item.expires}-ə qədər. ${item.reason}`);
  }
  for (const item of result.expired) {
    console.error(`MÜDDƏTİ BİTİB: ${item.id} (${item.package}) — istisna ${item.expires}-də bitib, yenidən qiymətləndirin.`);
  }
  for (const item of result.blocking) {
    console.error(`ZƏİFLİK: ${item.id} ${item.package} [${item.severity}] — ${item.title}`);
  }
  if (!result.ok) {
    console.error("\nAudit qapısı keçmədi. `npm audit` ilə ətraflı baxın.");
    process.exit(1);
  }
  console.log("Audit qapısı keçdi: high/critical zəiflik yoxdur (istisnalar yuxarıdadır).");
}
