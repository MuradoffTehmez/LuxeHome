const base = (process.env.SEO_BASE_URL || "https://luxehomeestate.az").replace(/\/$/, "");
const headers = { "user-agent": "LuxeHome-SERP-Acceptance/1.0" };
const failures = [];
const passes = [];
const skips = [];

async function request(path, options = {}) {
  const response = await fetch(`${base}${path}`, { headers, redirect: options.redirect || "follow" });
  return { response, text: await response.text() };
}

function check(condition, name, detail = "") {
  if (condition) passes.push(name);
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

function isCloudflareChallenge(result) {
  return result.response.headers.get("cf-mitigated") === "challenge" || /<title>Just a moment\.\.\.<\/title>/i.test(result.text);
}

function skipChallenge(result, names) {
  if (!isCloudflareChallenge(result)) return false;
  for (const name of names) skips.push(`${name} — Cloudflare yalnız verified bot/browser üçün challenge-i keçirir`);
  return true;
}

function wildcardDisallows(body) {
  const disallows = [];
  let agents = [];
  let directivesStarted = false;
  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*/, "").trim();
    if (!line) continue;
    const [field, ...rest] = line.split(":");
    const value = rest.join(":").trim();
    if (/^user-agent$/i.test(field)) {
      if (directivesStarted) agents = [];
      agents.push(value.toLowerCase());
      directivesStarted = false;
    }
    else {
      if (/^disallow$/i.test(field) && agents.includes("*")) disallows.push(value);
      directivesStarted = true;
    }
  }
  return disallows;
}

const rootResponse = await fetch(`${base}/`, { headers, redirect: "manual" });
const root = { response: rootResponse, text: await rootResponse.text() };
if (!skipChallenge(root, ["root sabit /az redirect"])) {
  check([301, 302, 307, 308].includes(root.response.status) && root.response.headers.get("location")?.endsWith("/az"), "root sabit /az redirect");
}

const wwwResponse = await fetch("https://www.luxehomeestate.az/az", { headers, redirect: "manual" });
const www = { response: wwwResponse, text: await wwwResponse.text() };
if (!skipChallenge(www, ["www canonical host redirect"])) {
  check([301, 302, 307, 308].includes(www.response.status) && www.response.headers.get("location")?.startsWith("https://luxehomeestate.az/az"), "www canonical host redirect", `${www.response.status} ${www.response.headers.get("location")}`);
}

for (const locale of ["az", "en", "ru"]) {
  const result = await request(`/${locale}`);
  if (skipChallenge(result, [`${locale} homepage 200`, `${locale} self-canonical`, `${locale} hreflang set`, `${locale} JSON-LD valid`])) continue;
  const { response, text } = result;
  check(response.status === 200, `${locale} homepage 200`, String(response.status));
  check(text.includes(`rel="canonical" href="${base}/${locale}"`), `${locale} self-canonical`);
  check(["az", "en", "ru", "x-default"].every((code) => new RegExp(`hreflang=["']${code}["']`, "i").test(text)), `${locale} hreflang set`);
  const jsonBlocks = [...text.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
  check(jsonBlocks.length > 0 && jsonBlocks.every((value) => { try { JSON.parse(value); return true; } catch { return false; } }), `${locale} JSON-LD valid`);
}

const home = await request("/az");
if (!skipChallenge(home, ["Organization entity schema"])) {
  check(home.text.includes('"RealEstateAgent"') && home.text.includes('"Organization"'), "Organization entity schema");
}

const facet = await request("/az/emlaklar?otaq=3&siralama=qiymet-artan");
if (!skipChallenge(facet, ["faceted listing 200", "faceted listing noindex"])) {
  check(facet.response.status === 200, "faceted listing 200");
  check(/<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i.test(facet.text), "faceted listing noindex");
}

const trailingResponse = await fetch(`${base}/az/emlaklar/`, { headers, redirect: "manual" });
const trailing = { response: trailingResponse, text: await trailingResponse.text() };
if (!skipChallenge(trailing, ["trailing slash normalization"])) {
  check([301, 302, 307, 308].includes(trailing.response.status) && trailing.response.headers.get("location")?.endsWith("/az/emlaklar"), "trailing slash normalization");
}

const robots = await request("/robots.txt");
check(robots.response.status === 200, "robots.txt 200");
check(/Sitemap:\s*https:\/\/luxehomeestate\.az\/sitemap\.xml/i.test(robots.text), "robots sitemap declaration");
const publicDisallows = wildcardDisallows(robots.text);
check(publicDisallows.includes("/admin") && !publicDisallows.includes("/"), "robots private-only block");

const sitemap = await request("/sitemap.xml");
check(sitemap.response.status === 200 && sitemap.text.includes("<sitemapindex"), "sitemap index 200");
check(sitemap.text.includes("/sitemaps/pages-az.xml") && sitemap.text.includes("/sitemaps/properties-ru-1.xml"), "sitemap locale/entity feeds");

for (const feed of ["pages-az.xml", "properties-az-1.xml", "agents-az.xml", "articles-en.xml", "landings-ru.xml"]) {
  const result = await request(`/sitemaps/${feed}`);
  if (skipChallenge(result, [`feed ${feed} valid`, `feed ${feed} canonical URLs`])) continue;
  check(result.response.status === 200 && result.text.includes("<urlset"), `feed ${feed} valid`);
  const locations = [...result.text.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  check(locations.every((url) => url.startsWith(base) && !url.includes("www.") && !url.includes("?")), `feed ${feed} canonical URLs`);
}

for (const path of ["/az/bazar-analitikasi", "/az/bazar-analitikasi/baki", "/az/agentler", "/az/agentlikler", "/az/bilik-merkezi", "/llms.txt"]) {
  const result = await request(path);
  if (skipChallenge(result, [`${path} 200`])) continue;
  check(result.response.status === 200, `${path} 200`, String(result.response.status));
}
const market = await request("/az/bazar-analitikasi/baki");
if (!skipChallenge(market, ["market Dataset schema", "market source and methodology visible"])) {
  check(market.text.includes('"@type":"Dataset"'), "market Dataset schema");
  check(market.text.includes("Metodologiya") && market.text.includes("Mənbə"), "market source and methodology visible");
}

const unknown = await request("/az/codex-serp-acceptance-404-20260831");
if (!skipChallenge(unknown, ["unknown URL true 404", "unknown URL noindex"])) {
  check(unknown.response.status === 404, "unknown URL true 404", String(unknown.response.status));
  check(/<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i.test(unknown.text), "unknown URL noindex");
}

const adminResponse = await fetch(`${base}/admin/serp`, { headers, redirect: "manual" });
check([302, 303, 307, 308, 401, 403].includes(adminResponse.status), "SEO admin auth boundary", String(adminResponse.status));

for (const name of passes) console.log(`PASS ${name}`);
for (const name of skips) console.warn(`SKIP ${name}`);
for (const failure of failures) console.error(`FAIL ${failure}`);
console.log(`\n${passes.length} passed, ${skips.length} skipped, ${failures.length} failed`);
if (failures.length) process.exitCode = 1;
