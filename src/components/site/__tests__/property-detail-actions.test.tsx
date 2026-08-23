import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ToastProvider } from "@/components/ui/toast";
import { Gallery } from "../gallery";
import { PropertyActionToolbar } from "../property-action-toolbar";
import { ShareButtons } from "../share-buttons";

describe("əmlak detal discovery və conversion əməliyyatları", () => {
  it("qalereyanı mobil swipe rail və desktop grid kimi eyni şəkillərlə render edir", () => {
    const html = renderToStaticMarkup(
      <Gallery
        title="Sahil villası"
        images={[
          { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c", alt: "Fasad" },
          { url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3", alt: "Qonaq otağı" },
        ]}
      />,
    );

    expect(html).toContain("-mx-4");
    expect(html).toContain("snap-mandatory");
    expect(html).toContain("sm:grid-cols-2");
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('aria-label="Fasad şəklini tam ekranda aç"');
    expect(html).toContain('aria-label="Qonaq otağı şəklini tam ekranda aç"');
  });

  it("favorit, müqayisə, paylaşma və mobil əlaqə CTA-larını vahid toolbar-da saxlayır", () => {
    const html = renderToStaticMarkup(
      <ToastProvider>
        <PropertyActionToolbar
          propertyId="property-1"
          path="/emlaklar/sahil-villasi"
          title="Sahil villası"
          phone="tel:+994519228585"
          whatsappHref="https://wa.me/994519228585?text=Salam"
        />
      </ToastProvider>,
    );

    expect(html).toContain('aria-label="Əmlak əməliyyatları"');
    expect(html).toContain('aria-label="Favoritlərə əlavə et"');
    expect(html).toContain('aria-label="Müqayisəyə əlavə et"');
    expect(html).toContain('aria-label="Elanı paylaş"');
    expect(html).toContain('aria-label="Səhifə əməliyyatları"');
    expect(html).toContain('href="tel:+994519228585"');
    expect(html).toContain('href="https://wa.me/994519228585?text=Salam"');
    expect(html).toContain("var(--safe-bottom)");
  });

  it("kompakt paylaşma təqdimatında URL müqaviləsini saxlayan vahid düymə göstərir", () => {
    const html = renderToStaticMarkup(
      <ShareButtons path="/emlaklar/sahil-villasi" title="Sahil villası" compact />,
    );

    expect(html).toContain('aria-label="Elanı paylaş"');
    expect(html).toContain("Paylaş");
    expect(html).not.toContain("Facebook");
  });
});
