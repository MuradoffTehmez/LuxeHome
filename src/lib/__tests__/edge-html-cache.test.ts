import { describe, expect, it } from "vitest";
import { edgeCacheKey, edgeCacheTtl, isEdgeCacheableRequest, isStorableResponse, toCachedCopy } from "@/lib/edge-html-cache";

const request = (path: string, init: RequestInit = {}) => new Request(`https://luxehomeestate.az${path}`, init);

describe("kənar HTML keşi", () => {
  it("staging-də və dəyər olmadıqda söndürülüdür, yuxarı həddi 600 saniyədir", () => {
    expect(edgeCacheTtl({ EDGE_HTML_CACHE_TTL: "60", IS_STAGING: "true" })).toBe(0);
    expect(edgeCacheTtl({})).toBe(0);
    expect(edgeCacheTtl({ EDGE_HTML_CACHE_TTL: "abc" })).toBe(0);
    expect(edgeCacheTtl({ EDGE_HTML_CACHE_TTL: "60" })).toBe(60);
    expect(edgeCacheTtl({ EDGE_HTML_CACHE_TTL: "9999" })).toBe(600);
  });

  it("yalnız anonim GET və siyasətin icazə verdiyi ictimai yolları keşləyir", () => {
    expect(isEdgeCacheableRequest(request("/az/emlaklar"))).toBe(true);
    expect(isEdgeCacheableRequest(request("/ru"))).toBe(true);
    // Sessiya: istifadəçiyə məxsus HTML
    expect(isEdgeCacheableRequest(request("/az", { headers: { cookie: "theme=dark; lhe_session=abc" } }))).toBe(false);
    // Adi cookie keşi bağlamır
    expect(isEdgeCacheableRequest(request("/az", { headers: { cookie: "analytics_consent=denied" } }))).toBe(true);
    // Sessiyadan asılı marşrut, panel, API, locale-siz yol və POST
    expect(isEdgeCacheableRequest(request("/az/emlaklar/villa-1"))).toBe(false);
    expect(isEdgeCacheableRequest(request("/az/kabinet"))).toBe(false);
    expect(isEdgeCacheableRequest(request("/admin"))).toBe(false);
    expect(isEdgeCacheableRequest(request("/api/og/property/x"))).toBe(false);
    expect(isEdgeCacheableRequest(request("/"))).toBe(false);
    expect(isEdgeCacheableRequest(request("/az", { method: "POST" }))).toBe(false);
  });

  it("sənəd və RSC naviqasiya sorğusu eyni açarı bölüşmür", async () => {
    const documentKey = await edgeCacheKey(request("/az/emlaklar"));
    const rscKey = await edgeCacheKey(request("/az/emlaklar", { headers: { rsc: "1" } }));
    expect(documentKey).not.toBe(rscKey);
    expect(await edgeCacheKey(request("/az/emlaklar"))).toBe(documentKey);
  });

  it("yalnız 200 HTML/RSC cavabını saxlayır, Set-Cookie-ni atır", () => {
    expect(isStorableResponse(new Response("x", { headers: { "content-type": "text/html; charset=utf-8" } }))).toBe(true);
    expect(isStorableResponse(new Response("x", { status: 404, headers: { "content-type": "text/html" } }))).toBe(false);
    expect(isStorableResponse(new Response("{}", { headers: { "content-type": "application/json" } }))).toBe(false);
    const copy = toCachedCopy(new Response("x", { headers: { "content-type": "text/html", "set-cookie": "NEXT_LOCALE=az" } }), 60);
    expect(copy.headers.get("set-cookie")).toBeNull();
    expect(copy.headers.get("cache-control")).toBe("public, max-age=60");
  });
});
