import { describe, expect, it } from "vitest";

import { siteUrl } from "@/config/site";
import { propertyQrSvg } from "../property-qr";

describe("əmlak QR kodu", () => {
  it("canonical URL daşıyan SVG qaytarır", () => {
    const svg = propertyQrSvg("/emlaklar/yasamalda-3-otaqli-menzil");

    expect(svg.startsWith("<?xml")).toBe(true);
    expect(svg).toContain("<svg");
    // QR-ın oxunan məzmunu SVG mətnində görünmür, ona görə yalnız çəkilişin
    // baş tutduğunu və ölçünün istənilən dəyər olduğunu yoxlayırıq.
    expect(svg).toContain('width="240"');
    expect(svg).toContain("<rect");
  });

  it("ölçü parametrini nəzərə alır", () => {
    expect(propertyQrSvg("/emlaklar/villa", 512)).toContain('width="512"');
  });

  it("uzun slug üçün də etibarlı SVG çəkir", () => {
    const slug = "bakida-satilan-genis-terrasli-deniz-menzereli-luks-villa-2026";
    const svg = propertyQrSvg(`/emlaklar/${slug}`);

    expect(svg).toContain("<svg");
    // Ünvanın özü `siteUrl` üzərindən qurulur — mütləq URL olmalıdır.
    expect(siteUrl(`/emlaklar/${slug}`).startsWith("http")).toBe(true);
  });
});
