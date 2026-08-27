import { spawnSync } from "node:child_process";

const baseUrl = (process.env.SEO_BASE_URL || "https://luxehomeestate.az").replace(/\/$/, "");
const unknownPaths = (
  process.env.SEO_UNKNOWN_PATHS ||
  process.env.SEO_UNKNOWN_PATH ||
  [
    "/az/codex-index-check-404-20260826",
    "/az/emlaklar/codex-missing",
    "/az/blog/codex-missing",
    "/az/layiheler/codex-missing",
    "/az/agentlikler/codex-missing",
    "/az/xidmetler/codex-missing",
    "/az/metro/codex-missing",
    "/az/rayon/codex-missing",
  ].join(",")
)
  .split(",")
  .map((path) => path.trim())
  .filter(Boolean);
const browserUserAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";
const extraHeaders = [
  ...(process.env.SEO_HOST_HEADER ? ["-H", `Host: ${process.env.SEO_HOST_HEADER}`] : []),
  ...(process.env.SEO_FORWARDED_PROTO
    ? ["-H", `x-forwarded-proto: ${process.env.SEO_FORWARDED_PROTO}`]
    : []),
];

const errors = [];

for (const unknownPath of unknownPaths) {
  const marker = "__SEO_STATUS__:";
  const curl = spawnSync(
    process.platform === "win32" ? "curl.exe" : "curl",
    [
      "-sS",
      "-A",
      browserUserAgent,
      ...extraHeaders,
      "-w",
      `\n${marker}%{http_code}`,
      `${baseUrl}${unknownPath}`,
    ],
    { encoding: "utf8" },
  );

  if (curl.status !== 0) {
    errors.push(`${unknownPath}: HTTP yoxlaması işləmədi: ${curl.stderr.trim()}`);
    continue;
  }

  const markerIndex = curl.stdout.lastIndexOf(`\n${marker}`);
  if (markerIndex < 0) {
    errors.push(`${unknownPath}: HTTP status marker-i tapılmadı`);
    continue;
  }

  const html = curl.stdout.slice(0, markerIndex);
  const status = Number(curl.stdout.slice(markerIndex + marker.length + 1).trim());
  const robotContents = Array.from(
    html.matchAll(/<meta[^>]+name=["'](?:robots|googlebot)["'][^>]+content=["']([^"']+)["'][^>]*>/gi),
    (match) => match[1].toLowerCase(),
  );

  if (status !== 404) {
    errors.push(`${unknownPath}: naməlum route 404 deyil: ${status}`);
  }
  if (!robotContents.some((content) => content.includes("noindex"))) {
    errors.push(`${unknownPath}: naməlum route noindex qaytarmır`);
  }
  if (robotContents.some((content) => /(^|[,\s])index([,\s]|$)/.test(content) && !content.includes("noindex"))) {
    errors.push(
      `${unknownPath}: ziddiyyətli index siqnalı qaytarır: ${robotContents.join(" | ")}`,
    );
  }

  if (
    status === 404 &&
    robotContents.some((content) => content.includes("noindex")) &&
    !robotContents.some((content) => /(^|[,\s])index([,\s]|$)/.test(content) && !content.includes("noindex"))
  ) {
    console.log(`PASS ${unknownPath} -> 404; robots=${robotContents.join(" | ")}`);
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`FAIL ${error}`);
  process.exitCode = 1;
}
