/**
 * Lokal stack E2E worker-ini işə salır (#87).
 *
 * `AUTH_SECRET` `prepare-local-stack.sh`-in yazdığı `e2e.env`-dən oxunur və
 * `--var` ilə ötürülür: wrangler `.dev.vars` mövcud olanda `--env-file`-ı nəzərə
 * almır, tərtibatçının `.dev.vars` faylına isə toxunmaq istəmirik. Sirr hər run
 * üçün təsadüfi yaradılır və yalnız lokal test bazası üçündür.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";

const STATE_DIR = process.env.E2E_STATE_DIR ?? ".wrangler/e2e-state";
const PORT = process.env.E2E_PORT ?? "8787";

const env = Object.fromEntries(
  readFileSync(`${STATE_DIR}/e2e.env`, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.includes("="))
    .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]),
);
if (!env.AUTH_SECRET) {
  console.error(`${STATE_DIR}/e2e.env içində AUTH_SECRET yoxdur — əvvəlcə npm run e2e:local:prepare`);
  process.exit(1);
}

/**
 * Workers AI binding-i həmişə remote-dur: wrangler onun üçün `--local` rejimində də
 * remote proxy açmağa çalışır və CI-də Cloudflare token-i olmadığından düşür. Test
 * worker-i üçün həmin binding-siz müvəqqəti konfiqurasiya yazılır (kök qovluqda —
 * nisbi yollar dəyişməsin); AI çağırışları deterministik fallback-ə düşür.
 */
const E2E_CONFIG = "wrangler.e2e.jsonc";

/** JSONC → JSON: şərhlər və sondakı vergüllər atılır, string-lər (URL-dəki `//`) qalır. */
function parseJsonc(text) {
  let out = "";
  let i = 0;
  while (i < text.length) {
    const char = text[i];
    if (char === '"') {
      let j = i + 1;
      while (j < text.length && text[j] !== '"') j += text[j] === "\\" ? 2 : 1;
      out += text.slice(i, j + 1);
      i = j + 1;
    } else if (text.startsWith("//", i)) {
      const end = text.indexOf("\n", i);
      i = end < 0 ? text.length : end;
    } else if (text.startsWith("/*", i)) {
      const end = text.indexOf("*/", i);
      i = end < 0 ? text.length : end + 2;
    } else {
      out += char;
      i += 1;
    }
  }
  return JSON.parse(out.replace(/,(\s*[}\]])/g, "$1"));
}

const config = parseJsonc(readFileSync("wrangler.jsonc", "utf8"));
delete config.ai;
writeFileSync(E2E_CONFIG, JSON.stringify(config, null, 2));

const child = spawn(
  "npx",
  [
    "opennextjs-cloudflare", "preview", "--config", E2E_CONFIG, "--",
    "--port", PORT,
    "--persist-to", STATE_DIR,
    // Remote binding-lər söndürülür: testlər canlı resurslara getməməlidir.
    "--local",
    "--var", "IS_STAGING:true",
    "--var", `AUTH_SECRET:${env.AUTH_SECRET}`,
  ],
  { stdio: "inherit", shell: process.platform === "win32" },
);
child.on("exit", (code) => process.exit(code ?? 0));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
