import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Overlay } from "../overlay";

describe("Overlay", () => {
  it("dialoqu öz unikal başlıq və təsvir id-ləri ilə əlaqələndirir", () => {
    const html = renderToStaticMarkup(
      <Overlay
        open
        onClose={() => undefined}
        title="Filtrlər"
        description="Axtarış şərtlərini seçin"
      >
        <button type="button">Tətbiq et</button>
      </Overlay>,
    );

    const labelledBy = html.match(/aria-labelledby="([^"]+)"/)?.[1];
    const describedBy = html.match(/aria-describedby="([^"]+)"/)?.[1];

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(labelledBy).toBeTruthy();
    expect(describedBy).toBeTruthy();
    expect(html).toContain(`id="${labelledBy}"`);
    expect(html).toContain(`id="${describedBy}"`);
  });

  it("bağlı olduqda dialoq markup-ı yaratmır", () => {
    const html = renderToStaticMarkup(
      <Overlay open={false} onClose={() => undefined} title="Menyu">
        <span>Məzmun</span>
      </Overlay>,
    );

    expect(html).toBe("");
  });

  it("backdrop-u accessibility ağacına ikinci bağlama düyməsi kimi əlavə etmir", () => {
    const html = renderToStaticMarkup(
      <Overlay open onClose={() => undefined} title="Menyu">
        <span>Məzmun</span>
      </Overlay>,
    );

    expect(html.match(/aria-label="Bağla"/g)).toHaveLength(1);
    expect(html).toContain('aria-hidden="true"');
  });
});
