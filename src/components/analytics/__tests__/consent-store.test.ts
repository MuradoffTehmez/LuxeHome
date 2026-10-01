import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Store modulu DOM-a çağırış anında müraciət edir; testdə `document`/`window`/`location`
 * minimal saxta obyektlərlə əvəz olunur (jsdom yoxdur). Hər test modulu təzədən yükləyir —
 * module səviyyəli vəziyyət (açıq parametrlər, yaddaş seçimi) sızmasın.
 */
type FakeDocument = {
  cookie: string;
  activeElement: unknown;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  getElementById: (id: string) => unknown;
};

function installDom(
  options: { cookiesBlocked?: boolean; protocol?: string; hostname?: string; scripts?: string[] } = {},
) {
  const jar = new Map<string, string>();
  const written: string[] = [];
  const doc: FakeDocument = {
    get cookie() {
      return [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
    },
    set cookie(value: string) {
      written.push(value);
      if (options.cookiesBlocked) return;
      const [pair, ...attributes] = value.split(";").map((part) => part.trim());
      const [name, ...rest] = pair.split("=");
      const expired = attributes.some((attribute) => attribute === "Max-Age=0");
      if (expired) jar.delete(name);
      else jar.set(name, rest.join("="));
    },
    activeElement: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    getElementById: (id: string) => ((options.scripts ?? []).includes(id) ? { id } : null),
  } as unknown as FakeDocument;
  const win: Record<string, unknown> = { addEventListener: vi.fn(), removeEventListener: vi.fn() };
  const reload = vi.fn();

  vi.stubGlobal("document", doc);
  vi.stubGlobal("window", win);
  vi.stubGlobal("location", {
    protocol: options.protocol ?? "https:",
    hostname: options.hostname ?? "luxehomeestate.az",
    reload,
  });
  vi.stubGlobal("HTMLElement", class {});
  vi.stubGlobal("requestAnimationFrame", (callback: () => void) => callback());
  return { doc, jar, written, win, reload };
}

async function loadStore() {
  vi.resetModules();
  return import("../consent-store");
}

describe("consent-store", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("seçim edilməyibsə unset oxuyur", async () => {
    installDom();
    const store = await loadStore();
    expect(store.readConsent()).toBe("unset");
  });

  it("setConsent cookie yazır, bir illik Secure/Lax və dinləyicilərə xəbər verir", async () => {
    const { written } = installDom();
    const store = await loadStore();

    store.setConsent("granted");

    expect(written[0]).toBe("analytics_consent=granted; Path=/; Max-Age=31536000; SameSite=Lax; Secure");
    expect(store.readConsent()).toBe("granted");
    store.setConsent("denied");
    expect(store.readConsent()).toBe("denied");
  });

  it("HTTP-də (lokal) Secure atributu yazmır", async () => {
    const { written } = installDom({ protocol: "http:", hostname: "localhost" });
    const store = await loadStore();

    store.setConsent("denied");

    expect(written[0]).not.toContain("Secure");
  });

  it("brauzer cookie-ni bloklayırsa seçim sessiya üçün yaddaşda qalır", async () => {
    installDom({ cookiesBlocked: true });
    const store = await loadStore();

    store.setConsent("denied");

    expect(store.readConsent()).toBe("denied");
  });

  it("purgeAnalyticsCookies yalnız analitika cookie-lərini silir", async () => {
    const { jar } = installDom();
    jar.set("analytics_consent", "denied");
    jar.set("_ga", "GA1.1.1");
    jar.set("_ga_54KSFRM17B", "GS2");
    jar.set("lhe_session", "abc");
    const store = await loadStore();

    const removed = store.purgeAnalyticsCookies();

    expect(removed).toBe(2);
    expect([...jar.keys()].sort()).toEqual(["analytics_consent", "lhe_session"]);
  });

  it("seçim və açıq parametrlər dinləyiciləri oyadır; abunəlik sonra təmizlənir", async () => {
    installDom();
    const store = await loadStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribeToConsent(listener);

    store.setConsent("granted");
    expect(listener).toHaveBeenCalledTimes(1);
    store.openConsentPreferences();
    expect(listener).toHaveBeenCalledTimes(2);
    store.closeConsentPreferences();
    expect(listener).toHaveBeenCalledTimes(3);

    unsubscribe();
    store.setConsent("denied");
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it("parametrlər bağlananda fokus onu açan elementə qayıdır", async () => {
    const { doc } = installDom();
    const focus = vi.fn();
    const Element = globalThis.HTMLElement as unknown as new () => object;
    doc.activeElement = Object.assign(new Element(), { isConnected: true, focus });
    const store = await loadStore();

    store.openConsentPreferences();
    expect(focus).not.toHaveBeenCalled();
    store.closeConsentPreferences();

    expect(focus).toHaveBeenCalledTimes(1);
  });

  describe("withdrawAnalytics", () => {
    it("GA birbaşa qoşulubsa söndürmə bayrağını qoyur, cookie-ləri silir, səhifəni yeniləmir", async () => {
      const { jar, win, reload } = installDom({ scripts: ["luxe-ga"] });
      jar.set("_ga", "GA1.1.1");
      jar.set("_ga_54KSFRM17B", "GS2");
      win.pendingAnalyticsEvents = [{ event: "phone_click", payload: {} }];
      const store = await loadStore();

      const result = store.withdrawAnalytics({ gaId: "G-54KSFRM17B" });

      expect(win["ga-disable-G-54KSFRM17B"]).toBe(true);
      expect(win.pendingAnalyticsEvents).toEqual([]);
      expect(result).toEqual({ purged: 2, reloaded: false });
      expect(jar.size).toBe(0);
      expect(reload).not.toHaveBeenCalled();
    });

    it("GTM konteyneri yüklənibsə cookie-lər artıq silinmiş olsa belə (başqa tabda geri çəkilib) səhifəni yeniləyir", async () => {
      // Reqressiya: yeniləmə `purged > 0` şərtinə bağlı idi — başqa tab cookie-ləri əvvəlcədən silibsə
      // bu tabda işləyən konteyner və tag-lar razılıq olmadan aktiv qalırdı.
      const { jar, reload } = installDom({ scripts: ["luxe-gtm"] });
      expect(jar.size).toBe(0);
      const store = await loadStore();

      const result = store.withdrawAnalytics({});

      expect(result).toEqual({ purged: 0, reloaded: true });
      expect(reload).toHaveBeenCalledTimes(1);
    });

    it("GTM cookie-lərlə birlikdə yüklənibsə də bir dəfə yeniləyir", async () => {
      const { jar, reload } = installDom({ scripts: ["luxe-gtm"] });
      jar.set("_ga", "GA1.1.1");
      jar.set("_gcl_au", "1");
      const store = await loadStore();

      expect(store.withdrawAnalytics({})).toEqual({ purged: 2, reloaded: true });
      expect(reload).toHaveBeenCalledTimes(1);
      expect(jar.size).toBe(0);
    });

    it("GTM heç yüklənməyibsə (məs. imtina ilə açılan səhifə) yeniləmir — dövr yoxdur", async () => {
      const { reload } = installDom();
      const store = await loadStore();

      expect(store.withdrawAnalytics({})).toEqual({ purged: 0, reloaded: false });
      expect(reload).not.toHaveBeenCalled();
    });

    it("yalnız GA ID olanda GTM skripti olsa belə yeniləmir (söndürmə bayrağı kifayətdir)", async () => {
      const { reload } = installDom({ scripts: ["luxe-gtm"] });
      const store = await loadStore();

      expect(store.withdrawAnalytics({ gaId: "G-X" }).reloaded).toBe(false);
      expect(reload).not.toHaveBeenCalled();
    });
  });

  it("setGaDisabled bayrağı aça və bağlaya bilir", async () => {
    const { win } = installDom();
    const store = await loadStore();

    store.setGaDisabled("G-X", true);
    expect(win["ga-disable-G-X"]).toBe(true);
    store.setGaDisabled("G-X", false);
    expect(win["ga-disable-G-X"]).toBe(false);
  });

  it("açıq olmayan parametrləri bağlamaq heç nə etmir", async () => {
    installDom();
    const store = await loadStore();
    expect(() => store.closeConsentPreferences()).not.toThrow();
  });
});
