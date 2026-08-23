import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ImageDropzone } from "../image-dropzone";

describe("ImageDropzone responsive idarələri", () => {
  it("mobil preview-ləri iki sütunda və 44 px əməl hədəfləri ilə göstərir", () => {
    const html = renderToStaticMarkup(
      <ImageDropzone
        name="images"
        label="Qalereya"
        folder="emlaklar"
        initial={[
          { url: "https://media.luxehomeestate.az/a.jpg", alt: "A", isCover: true },
          { url: "https://media.luxehomeestate.az/b.jpg", alt: "B", isCover: false },
        ]}
      />,
    );

    expect(html).toContain("grid-cols-2");
    expect(html).toContain("sm:grid-cols-3");
    expect(html).toContain("lg:grid-cols-4");
    expect(html.match(/size-11/g)?.length).toBeGreaterThanOrEqual(4);
    expect(html).toContain("min-h-11");
  });
});
