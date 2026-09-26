/**
 * Lokal stack E2E worker-ini işə salır (#87).
 *
 * `AUTH_SECRET` `prepare-local-stack.sh`-in yazdığı `e2e.env`-dən oxunur və
 * `--var` ilə ötürülür: wrangler `.dev.vars` mövcud olanda `--env-file`-ı nəzərə
 * almır, tərtibatçının `.dev.vars` faylına isə toxunmaq istəmirik. Sirr hər run
 * üçün təsadüfi yaradılır və yalnız lokal test bazası üçündür.
 */
import { readFileSync } from "node:fs";
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

const child = spawn(
  "npx",
  [
    "opennextjs-cloudflare", "preview", "--",
    "--port", PORT,
    "--persist-to", STATE_DIR,
    "--var", "IS_STAGING:true",
    "--var", `AUTH_SECRET:${env.AUTH_SECRET}`,
  ],
  { stdio: "inherit", shell: process.platform === "win32" },
);
child.on("exit", (code) => process.exit(code ?? 0));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
