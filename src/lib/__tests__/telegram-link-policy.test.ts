import { describe, expect, it } from "vitest";
import { formatTelegramNotice, parseStartCommand, telegramStartLink } from "../telegram-link-policy";

const TOKEN = "AbCdEfGhIjKlMnOpQrStUvWx12";

describe("Telegram bağlama qaydaları", () => {
  it("yalnız şəxsi çatdakı /start <token> əmrini qəbul edir", () => {
    expect(parseStartCommand({ message: { text: `/start ${TOKEN}`, chat: { id: 42, type: "private" } } })).toEqual({ chatId: "42", token: TOKEN });
    expect(parseStartCommand({ message: { text: `/start@LuxeBot ${TOKEN}`, chat: { id: 42, type: "private" } } })?.token).toBe(TOKEN);
    expect(parseStartCommand({ message: { text: `/start ${TOKEN}`, chat: { id: -1, type: "group" } } })).toBeNull();
    expect(parseStartCommand({ message: { text: "/start", chat: { id: 42, type: "private" } } })).toBeNull();
    expect(parseStartCommand({ message: { text: "/start <script>", chat: { id: 42, type: "private" } } })).toBeNull();
    expect(parseStartCommand({ edited_message: {} })).toBeNull();
    expect(parseStartCommand(null)).toBeNull();
  });

  it("start linkini qurur və bot adındakı @ işarəsini atır", () => {
    expect(telegramStartLink("@LuxeHomeBot", TOKEN)).toBe(`https://t.me/LuxeHomeBot?start=${TOKEN}`);
  });

  it("bildiriş mətnini HTML üçün kodlaşdırır", () => {
    const html = formatTelegramNotice({ title: "Yeni <müraciət>", content: "A & B", url: "https://x.az/a?b=1&c=2", open: "Aç" });
    expect(html).toContain("<b>Yeni &lt;müraciət&gt;</b>");
    expect(html).toContain("A &amp; B");
    expect(html).toContain('href="https://x.az/a?b=1&amp;c=2"');
  });
});
