import { describe, expect, it } from "vitest";
import { tourEmbedUrl } from "../property-tour";

describe("virtual tur embed ünvanı", () => {
  it("tanınan platformaları embed formasına salır", () => {
    expect(tourEmbedUrl("https://kuula.co/share/7abc1")).toBe("https://kuula.co/share/7abc1?fs=1&vr=1&thumbs=1&info=0&logo=0");
    expect(tourEmbedUrl("https://my.matterport.com/show/?m=AbC123")).toBe("https://my.matterport.com/show/?m=AbC123&play=1");
    expect(tourEmbedUrl("https://momento360.com/e/u/abc?utm_campaign=x")).toBe("https://momento360.com/e/u/abc");
  });

  it("naməlum host, http və saxta parametr embed olunmur", () => {
    expect(tourEmbedUrl("https://evil.example/share/abc")).toBeNull();
    expect(tourEmbedUrl("http://kuula.co/share/7abc1")).toBeNull();
    expect(tourEmbedUrl("https://my.matterport.com/show/?m=abc%22onload")).toBeNull();
    expect(tourEmbedUrl("not a url")).toBeNull();
  });
});
