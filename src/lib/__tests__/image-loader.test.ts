import { describe, expect, it } from "vitest";
import imageLoader from "@/lib/image-loader";
import { isUnoptimizedImage } from "@/lib/utils";

describe("qlobal şəkil loader-i", () => {
  it("/media ünvanını worker-in kiçiltmə sorğusuna çevirir", () => {
    expect(imageLoader({ src: "/media/emlaklar/2026/10/x.webp", width: 828 })).toBe("/media/emlaklar/2026/10/x.webp?w=828&q=75");
    expect(imageLoader({ src: "/media/umumi/x.webp?v=2", width: 1080, quality: 65 })).toBe("/media/umumi/x.webp?w=1080&q=65");
  });

  it("qalan ünvanları Next-in defolt formasında /_next/image-ə göndərir", () => {
    expect(imageLoader({ src: "/logo-mark.png", width: 64 })).toBe("/_next/image?url=%2Flogo-mark.png&w=64&q=75");
    expect(imageLoader({ src: "https://images.unsplash.com/p?a=1", width: 640, quality: 65 })).toBe(
      "/_next/image?url=https%3A%2F%2Fimages.unsplash.com%2Fp%3Fa%3D1&w=640&q=65",
    );
  });

  it("/media artıq unoptimized deyil; blob və SVG olduğu kimi qalır", () => {
    expect(isUnoptimizedImage("/media/emlaklar/x.webp")).toBe(false);
    expect(isUnoptimizedImage("blob:https://luxehomeestate.az/1")).toBe(true);
    expect(isUnoptimizedImage("https://treva.realestate/logo.svg")).toBe(true);
  });
});
