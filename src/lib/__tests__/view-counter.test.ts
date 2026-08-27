import { describe, expect, it } from "vitest";
import { isLikelyBot } from "../view-counter";

/**
 * Baxış sayğacının bot filtri.
 *
 * Sayğac panel dashboard-unu və bloq yazısının «N baxış» sətrini qidalandırır —
 * robot trafiki sayılsa, rəqəmlər real maraq göstəricisi olmaqdan çıxır.
 */

describe("isLikelyBot", () => {
  it("user-agent yoxdursa bot sayır", () => {
    expect(isLikelyBot(null)).toBe(true);
    expect(isLikelyBot(undefined)).toBe(true);
    expect(isLikelyBot("")).toBe(true);
  });

  it("tanınmış robotları tutur", () => {
    const bots = [
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
      "Mozilla/5.0 (compatible; YandexBot/3.0)",
      "facebookexternalhit/1.1",
      "curl/8.4.0",
      "python-requests/2.31.0",
      "Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/120.0.0.0",
    ];
    for (const agent of bots) {
      expect(isLikelyBot(agent), agent).toBe(true);
    }
  });

  it("real brauzerləri buraxır", () => {
    const browsers = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
      "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
    ];
    for (const agent of browsers) {
      expect(isLikelyBot(agent), agent).toBe(false);
    }
  });
});
