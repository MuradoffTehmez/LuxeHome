#!/usr/bin/env node

import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const DEFAULT_ROUTES = ["/", "/emlaklar", "/blog", "/xidmetler", "/haqqimizda", "/elaqe"];

function parseAttributes(tag) {
  const attributes = {};
  const attributePattern = /([:\w-]+)\s*=\s*(["'])(.*?)\2/gs;
  for (const match of tag.matchAll(attributePattern)) {
    attributes[match[1].toLowerCase()] = match[3];
  }
  return attributes;
}

function findTagContent(html, tagName) {
  const match = html.match(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match?.[1]?.trim() || "";
}

function findMeta(html, key, value) {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = parseAttributes(match[0]);
    if (attributes[key] === value) return attributes.content || "";
  }
  return "";
}

function findLink(html, rel) {
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const attributes = parseAttributes(match[0]);
    if ((attributes.rel || "").split(/\s+/).includes(rel)) return attributes.href || "";
  }
  return "";
}

function countMatches(value, pattern) {
  return [...value.matchAll(pattern)].length;
}

export function inspectHtml(html, { canonicalOrigin = "https://luxehomeestate.az" } = {}) {
  const errors = [];
  const title = findTagContent(html, "title");
  const description = findMeta(html, "name", "description");
  const robots = findMeta(html, "name", "robots");
  const canonical = findLink(html, "canonical");
  const ogTitle = findMeta(html, "property", "og:title");
  const ogDescription = findMeta(html, "property", "og:description");
  const ogUrl = findMeta(html, "property", "og:url");
  const h1Count = countMatches(html, /<h1\b[^>]*>/gi);
  const internalHrefs = [...html.matchAll(/<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1/gi)]
    .map((match) => match[2])
    .filter((href) => href.startsWith("/") && !href.startsWith("//") && !href.startsWith("/_next"));
  const jsonLdBlocks = [...html.matchAll(/<script\b[^>]*type\s*=\s*(["'])application\/ld\+json\1[^>]*>([\s\S]*?)<\/script>/gi)];

  if (!title) errors.push("title yoxdur");
  if (!description) errors.push("meta description yoxdur");
  if (/\bnoindex\b/i.test(robots)) errors.push(`indexable route noindex qaytarır: ${robots}`);
  if (!canonical) errors.push("canonical yoxdur");
  if (!ogTitle) errors.push("og:title yoxdur");
  if (!ogDescription) errors.push("og:description yoxdur");
  if (!ogUrl) errors.push("og:url yoxdur");
  if (h1Count !== 1) errors.push(`H1 sayı 1 deyil: ${h1Count}`);
  if (internalHrefs.length === 0) errors.push("daxili href yoxdur");
  if (jsonLdBlocks.length === 0) errors.push("JSON-LD yoxdur");

  if (canonical) {
    try {
      const parsedCanonical = new URL(canonical);
      if (parsedCanonical.origin !== canonicalOrigin) {
        errors.push(`canonical host yanlışdır: ${parsedCanonical.origin}`);
      }
      if (parsedCanonical.search || parsedCanonical.hash) {
        errors.push("canonical query/hash saxlayır");
      }
    } catch {
      errors.push("canonical mütləq URL deyil");
    }
  }

  for (const [, , json] of jsonLdBlocks) {
    try {
      JSON.parse(json);
    } catch {
      errors.push("JSON-LD parse olunmur");
    }
  }

  return {
    errors,
    internalHrefs,
    summary: {
      title,
      descriptionLength: description.length,
      canonical,
      robots: robots || "index, follow (default)",
      h1Count,
      internalHrefCount: internalHrefs.length,
      jsonLdCount: jsonLdBlocks.length,
    },
  };
}

export function extractSitemapLocations(body) {
  return [...body.matchAll(/<loc>(.*?)<\/loc>/gi)].map((match) => match[1].trim());
}

export function inspectRobots(body, canonicalOrigin = "https://luxehomeestate.az") {
  const errors = [];
  if (!/^user-agent:/im.test(body)) errors.push("robots.txt User-agent saxlamır");
  if (!new RegExp(`^sitemap:\\s*${canonicalOrigin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\/sitemap\\.xml$`, "im").test(body)) {
    errors.push("robots.txt canonical sitemap saxlamır");
  }
  return errors;
}

export function inspectSitemap(body, canonicalOrigin = "https://luxehomeestate.az") {
  const errors = [];
  if (!/<urlset\b/i.test(body)) errors.push("sitemap urlset deyil");
  const locations = extractSitemapLocations(body);
  if (locations.length === 0) errors.push("sitemap URL saxlamır");
  for (const location of locations) {
    if (!location.startsWith(`${canonicalOrigin}/`) && location !== canonicalOrigin) {
      errors.push(`sitemap canonical host xaricində URL saxlayır: ${location}`);
    }
    if (/[?#]/.test(location)) errors.push(`sitemap parametrli URL saxlayır: ${location}`);
  }
  return errors;
}

function readArgument(name, fallback) {
  const prefix = `--${name}=`;
  const argument = process.argv.find((value) => value.startsWith(prefix));
  return argument ? argument.slice(prefix.length) : fallback;
}

async function fetchText(url, headers) {
  const response = await fetch(url, {
    redirect: "follow",
    headers,
    signal: AbortSignal.timeout(20_000),
  });
  return { response, body: await response.text() };
}

export async function runSmoke({
  baseUrl,
  canonicalOrigin = "https://luxehomeestate.az",
  routes = DEFAULT_ROUTES,
  requestHeaders,
} = {}) {
  if (!baseUrl) throw new Error("baseUrl tələb olunur");
  const origin = new URL(baseUrl).origin;
  const failures = [];
  const discoveredInternalHrefs = new Set();

  for (const route of routes) {
    try {
      const { response, body } = await fetchText(new URL(route, origin), requestHeaders);
      if (response.status !== 200) {
        failures.push(`${route}: HTTP ${response.status}`);
        continue;
      }
      const result = inspectHtml(body, { canonicalOrigin });
      for (const href of result.internalHrefs) discoveredInternalHrefs.add(href);
      if (result.errors.length) failures.push(`${route}: ${result.errors.join("; ")}`);
      console.log(`${result.errors.length ? "FAIL" : "PASS"} ${route}`, result.summary);
    } catch (error) {
      failures.push(`${route}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  for (const [route, inspector] of [
    ["/robots.txt", inspectRobots],
    ["/sitemap.xml", inspectSitemap],
  ]) {
    try {
      const { response, body } = await fetchText(new URL(route, origin), requestHeaders);
      const errors = response.status === 200 ? inspector(body, canonicalOrigin) : [`HTTP ${response.status}`];
      if (errors.length) failures.push(`${route}: ${errors.join("; ")}`);
      console.log(`${errors.length ? "FAIL" : "PASS"} ${route}`);

      if (route === "/sitemap.xml" && response.status === 200) {
        for (const location of extractSitemapLocations(body)) {
          const target = new URL(location);
          const localUrl = new URL(`${target.pathname}${target.search}`, origin);
          const sitemapResponse = await fetch(localUrl, {
            redirect: "follow",
            headers: requestHeaders,
            signal: AbortSignal.timeout(20_000),
          });
          if (sitemapResponse.status !== 200) {
            failures.push(`sitemap URL ${target.pathname}: HTTP ${sitemapResponse.status}`);
          }
          await sitemapResponse.body?.cancel();
        }
        console.log(`CHECK sitemap URL statusları: ${extractSitemapLocations(body).length}`);
      }
    } catch (error) {
      failures.push(`${route}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  for (const href of discoveredInternalHrefs) {
    const target = new URL(href, origin);
    const response = await fetch(target, {
      redirect: "follow",
      headers: requestHeaders,
      signal: AbortSignal.timeout(20_000),
    });
    if (response.status >= 400) failures.push(`daxili link ${href}: HTTP ${response.status}`);
    await response.body?.cancel();
  }
  console.log(`CHECK daxili link statusları: ${discoveredInternalHrefs.size}`);

  if (failures.length) {
    throw new Error(`SEO smoke uğursuz oldu:\n- ${failures.join("\n- ")}`);
  }
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isDirectRun) {
  const baseUrl = readArgument("base-url", process.env.SEO_BASE_URL || "http://127.0.0.1:3000");
  const canonicalOrigin = readArgument("canonical-origin", process.env.SEO_CANONICAL_ORIGIN || "https://luxehomeestate.az");
  const requestHost = readArgument("request-host", process.env.SEO_REQUEST_HOST || "");
  const forwardedProtocol = readArgument("forwarded-proto", process.env.SEO_FORWARDED_PROTO || "");
  const requestHeaders = {
    ...(requestHost ? { host: requestHost } : {}),
    ...(forwardedProtocol ? { "x-forwarded-proto": forwardedProtocol } : {}),
  };
  runSmoke({ baseUrl, canonicalOrigin, requestHeaders }).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
