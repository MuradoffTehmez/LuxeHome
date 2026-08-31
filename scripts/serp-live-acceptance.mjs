const base = (process.env.SEO_BASE_URL || "https://luxehomeestate.az").replace(/\/$/, "");
const headers = { "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" };
const failures = [];
const passes = [];

async function request(path, options = {}) {
  const response = await fetch(`${base}${path}`, { headers, redirect: options.redirect || "follow" });
  return { response, text: await response.text() };
}

function check(condition, name, detail = "") {
  if (condition) passes.push(name);
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

const root = await fetch(`${base}/`, { headers, redirect: "manual" });
check([301, 302, 307, 308].includes(root.status) && root.headers.get("location")?.endsWith("/az"), "root sabit /az redirect");

const www = await fetch("https://www.luxehomeestate.az/az", { headers, redirect: "manual" });
check([301, 302, 307, 308].includes(www.status) && www.headers.get("location")?.startsWith("https://luxehomeestate.az/az"), "www canonical host redirect", `${www.status} ${www.headers.get("location")}`);

for (const locale of ["az", "en", "ru"]) {
  const { response, text } = await request(`/${locale}`);
  check(response.status === 200, `${locale} homepage 200`, String(response.status));
  check(text.includes(`rel="canonical" href="${base}/${locale}"`), `${locale} self-canonical`);
  check(["az", "en", "ru", "x-default"].every((code) => text.includes(`hreflang="${code}"`)), `${locale} hreflang set`);
  const jsonBlocks = [...text.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
  check(jsonBlocks.length > 0 && jsonBlocks.every((value) => { try { JSON.parse(value); return true; } catch { return false; } }), `${locale} JSON-LD valid`);
}

const home = await request("/az");
check(home.text.includes('"RealEstateAgent"') && home.text.includes('"Organization"'), "Organization entity schema");

const facet = await request("/az/emlaklar?otaq=3&siralama=qiymet-artan");
check(facet.response.status === 200, "faceted listing 200");
check(/<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i.test(facet.text), "faceted listing noindex");

const trailing = await fetch(`${base}/az/emlaklar/`, { headers, redirect: "manual" });
check([301, 302, 307, 308].includes(trailing.status) && trailing.headers.get("location")?.endsWith("/az/emlaklar"), "trailing slash normalization");

const robots = await request("/robots.txt");
check(robots.response.status === 200, "robots.txt 200");
check(/Sitemap:\s*https:\/\/luxehomeestate\.az\/sitemap\.xml/i.test(robots.text), "robots sitemap declaration");
check(/Disallow:\s*\/admin/i.test(robots.text) && !/^Disallow:\s*\/$/im.test(robots.text), "robots private-only block");

const sitemap = await request("/sitemap.xml");
check(sitemap.response.status === 200 && sitemap.text.includes("<sitemapindex"), "sitemap index 200");
check(sitemap.text.includes("/sitemaps/pages-az.xml") && sitemap.text.includes("/sitemaps/properties-ru-1.xml"), "sitemap locale/entity feeds");

for (const feed of ["pages-az.xml", "properties-az-1.xml", "agents-az.xml", "articles-en.xml", "landings-ru.xml"]) {
  const result = await request(`/sitemaps/${feed}`);
  check(result.response.status === 200 && result.text.includes("<urlset"), `feed ${feed} valid`);
  const locations = [...result.text.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  check(locations.every((url) => url.startsWith(base) && !url.includes("www.") && !url.includes("?")), `feed ${feed} canonical URLs`);
}

for (const path of ["/az/bazar-analitikasi", "/az/bazar-analitikasi/baki", "/az/agentler", "/az/agentlikler", "/az/bilik-merkezi", "/llms.txt"]) {
  const result = await request(path);
  check(result.response.status === 200, `${path} 200`, String(result.response.status));
}
const market = await request("/az/bazar-analitikasi/baki");
check(market.text.includes('"@type":"Dataset"'), "market Dataset schema");
check(market.text.includes("Metodologiya") && market.text.includes("Mənbə"), "market source and methodology visible");

const unknown = await request("/az/codex-serp-acceptance-404-20260831");
check(unknown.response.status === 404, "unknown URL true 404", String(unknown.response.status));
check(/<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i.test(unknown.text), "unknown URL noindex");

const admin = await fetch(`${base}/admin/serp`, { headers, redirect: "manual" });
check([302, 303, 307, 308, 401, 403].includes(admin.status), "SEO admin auth boundary", String(admin.status));

for (const name of passes) console.log(`PASS ${name}`);
for (const failure of failures) console.error(`FAIL ${failure}`);
console.log(`\n${passes.length} passed, ${failures.length} failed`);
if (failures.length) process.exitCode = 1;
