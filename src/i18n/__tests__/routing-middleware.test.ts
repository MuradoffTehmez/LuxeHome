import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

describe("locale middleware SEO siqnalları", () => {
  it("hreflang üçün HTML metadata-nı yeganə mənbə saxlayır", () => {
    const middleware = createIntlMiddleware(routing);
    const response = middleware(
      new NextRequest("https://luxehomeestate.az/az/emlaklar"),
    );

    expect(response.headers.get("Link")).toBeNull();
  });
});
