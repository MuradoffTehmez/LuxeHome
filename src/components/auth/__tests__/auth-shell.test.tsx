import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AuthShell } from "../auth-shell";

describe("AuthShell", () => {
  it("mobil axında formanı birinci, əlavə məlumatı isə yalnız desktopda göstərir", () => {
    const html = renderToStaticMarkup(
      <AuthShell
        eyebrow="Şəxsi kabinet"
        title="Hesaba giriş"
        description="Elanlarınızı idarə edin."
        aside={<p>Etibarlı hesab üstünlükləri</p>}
      >
        <form aria-label="Giriş forması" />
      </AuthShell>,
    );

    expect(html.indexOf("Giriş forması")).toBeLessThan(
      html.indexOf("Etibarlı hesab üstünlükləri"),
    );
    expect(html).toContain("min-h-[calc(100dvh-var(--header-h))]");
    expect(html).toContain("max-w-lg");
    expect(html).toContain("hidden lg:block");
  });
});
