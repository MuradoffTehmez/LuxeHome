import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ImageDropzone } from "../image-dropzone";

describe("ImageDropzone responsive idarələri", () => {
  it("preview-ləri 480 px-dən iki sütunda və 44 px əməl hədəfləri ilə göstərir", () => {
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

    expect(html).toContain("min-[480px]:grid-cols-2");
    expect(html).toContain("(max-width: 479px) 100vw");
    expect(html).toContain("sm:grid-cols-3");
    expect(html).toContain("lg:grid-cols-4");
    expect(html.match(/size-11/g)?.length).toBeGreaterThanOrEqual(4);
    expect(html).toContain("min-h-11");
  });

  it("boş alt mətn üçün görünən warning və dekorativ şəkil izahı göstərir", () => {
    const html = renderToStaticMarkup(
      <ImageDropzone
        name="cover"
        label="Üz qabığı"
        folder="bloq"
        mode="single"
        initial={[{ url: "https://media.luxehomeestate.az/cover.jpg", alt: "", isCover: true }]}
      />,
    );
    expect(html).toContain("Alt mətn boşdur");
    expect(html).toContain("yalnız dekorativdirsə boş saxlayın");
  });
});
