import { describe, expect, it } from "vitest";
import { routing } from "@/i18n/routing";
import { rootRedirect } from "@/lib/root-redirect";

const request = (path: string, init: RequestInit = {}) => new Request(`https://luxehomeestate.az${path}`, init);

describe("kök ünvanın yönləndirməsi", () => {
  it("dil təyini söndürülüdür — qısa yolun şərti", () => {
    // Açılsa `/` ziyarətçiyə görə fərqli dilə getməlidir və bu qısa yol söndürülür.
    expect(routing.localeDetection).toBe(false);
  });

  it("/ ünvanını query string ilə default dilə keşlənə bilən 307 ilə yönləndirir", () => {
    const response = rootRedirect(request("/?utm_source=instagram&x=1"));
    expect(response?.status).toBe(307);
    expect(response?.headers.get("location")).toBe(`/${routing.defaultLocale}?utm_source=instagram&x=1`);
    expect(response?.headers.get("cache-control")).toBe("public, max-age=3600");
    expect(rootRedirect(request("/", { method: "HEAD" }))?.status).toBe(307);
  });

  it("başqa yola və metoda toxunmur", () => {
    expect(rootRedirect(request("/az"))).toBeNull();
    expect(rootRedirect(request("/emlaklar"))).toBeNull();
    expect(rootRedirect(request("/sitemap.xml"))).toBeNull();
    expect(rootRedirect(request("/", { method: "POST" }))).toBeNull();
  });

  it("kanonik olmayan host və protokolu middleware-in kanonik yönləndirməsinə buraxır", () => {
    expect(rootRedirect(new Request("https://www.luxehomeestate.az/"))).toBeNull();
    expect(rootRedirect(new Request("http://luxehomeestate.az/"))).toBeNull();
    expect(rootRedirect(new Request("https://luxehomeestate.amiyevbahadur.workers.dev/"))).toBeNull();
    expect(rootRedirect(new Request("https://luxehomeestate-staging.amiyevbahadur.workers.dev/"))).toBeNull();
  });
});
