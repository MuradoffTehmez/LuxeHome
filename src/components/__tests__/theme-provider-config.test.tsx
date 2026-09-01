import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-themes", () => ({
  ThemeProvider: ({
    children,
    defaultTheme,
    enableSystem,
    themes,
  }: {
    children: React.ReactNode;
    defaultTheme: string;
    enableSystem: boolean;
    themes: string[];
  }) => (
    <div
      data-default-theme={defaultTheme}
      data-enable-system={String(enableSystem)}
      data-themes={themes.join(",")}
    >
      {children}
    </div>
  ),
}));

import { ThemeProvider } from "../theme-provider";

describe("ThemeProvider konfiqurasiyası", () => {
  it("default açıqdır və sistem temasını qəbul etmir", () => {
    const html = renderToStaticMarkup(<ThemeProvider><span>Məzmun</span></ThemeProvider>);

    expect(html).toContain('data-default-theme="light"');
    expect(html).toContain('data-enable-system="false"');
    expect(html).toContain('data-themes="light,dark"');
  });

  it("köhnə və naməlum dəyəri açıq temaya normallaşdırır", () => {
    const html = renderToStaticMarkup(<ThemeProvider defaultTheme="system"><span /></ThemeProvider>);

    expect(html).toContain('data-default-theme="light"');
  });
});
