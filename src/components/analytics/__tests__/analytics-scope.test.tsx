import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/admin/analitika" }));

let report: ((metric: { name: string; value: number; rating?: string; navigationType?: string }) => void) | null = null;
vi.mock("next/web-vitals", () => ({
  useReportWebVitals: (callback: typeof report) => {
    report = callback;
  },
}));

import { isAdminRoute } from "../analytics-provider";
import { WebVitalsReporter } from "../web-vitals-reporter";

describe("analitika əhatəsi", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /**
   * GTM kök layout-dadır, yəni `/admin` da onun altına düşür. `ADMIN_CSP`
   * `googletagmanager.com`-a icazə vermir — skript və `ns.html` freymi konsolda
   * bloklanırdı, razılıq banneri isə panelə çıxırdı.
   */
  it("panel marşrutlarını marketinq analitikasından kənarda saxlayır", () => {
    expect(isAdminRoute("/admin")).toBe(true);
    expect(isAdminRoute("/admin/analitika")).toBe(true);
    expect(isAdminRoute(null)).toBe(false);
    expect(isAdminRoute("/az/emlaklar")).toBe(false);
    // Ad oxşarlığı panel sayılmamalıdır
    expect(isAdminRoute("/az/administrativ-rayonlar")).toBe(false);
  });

  /**
   * `useReportWebVitals` Next.js-in öz ölçülərini də verir; onların adı server
   * enum-una düşmür və `/api/monitoring/vitals` hər yüklənişdə 400 qaytarırdı.
   */
  it("yalnız Core Web Vitals ölçülərini göndərir", () => {
    const sendBeacon = vi.fn<(url: string, body?: BodyInit) => boolean>(() => true);
    vi.stubGlobal("navigator", { sendBeacon });
    vi.stubGlobal("window", { location: { pathname: "/az" } });

    renderToStaticMarkup(<WebVitalsReporter />);
    expect(report).not.toBeNull();

    report!({ name: "Next.js-hydration", value: 12 });
    report!({ name: "Next.js-route-change-to-render", value: 8 });
    expect(sendBeacon).not.toHaveBeenCalled();

    report!({ name: "LCP", value: 1200, rating: "good" });
    expect(sendBeacon).toHaveBeenCalledTimes(1);
    expect(sendBeacon.mock.calls[0]![0]).toBe("/api/monitoring/vitals");
  });
});
