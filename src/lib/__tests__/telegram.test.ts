import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const settings = vi.hoisted(() => ({ value: null as string | null }));
vi.mock("@/lib/settings", () => ({
  SETTING_KEYS: { LEAD_NOTIFY_ENABLED: "lead.notify_enabled" },
  getSetting: async () => settings.value,
}));

import { formatLeadTelegramMessage, notifyLeadOnTelegram } from "@/lib/telegram";

describe("Telegram lead bildirişi", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    settings.value = null;
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("ziyarətçi mətnini HTML kimi kodlayır — Telegram HTML parse_mode-da inyeksiya olmasın", () => {
    const text = formatLeadTelegramMessage({
      kind: "lead",
      id: "lead-1",
      name: "<b>Hacker</b>",
      phone: "+994501234567",
      message: "<a href=\"https://evil.example\">klik</a>",
    });
    expect(text).not.toContain("<b>Hacker</b>");
    expect(text).toContain("&lt;b&gt;Hacker&lt;/b&gt;");
    expect(text).not.toContain("https://evil.example\">");
    expect(text).toContain("/admin/muracietler/lead-1");
  });

  it("uzun mesajı qısaldır", () => {
    const text = formatLeadTelegramMessage({ kind: "lead", id: "x", name: "A", phone: "1", message: "a".repeat(2000) });
    expect(text.length).toBeLessThan(1200);
    expect(text).toContain("…");
  });

  it("secret yoxdursa şəbəkəyə getmir", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "");
    vi.stubEnv("TELEGRAM_CHAT_ID", "");
    await expect(notifyLeadOnTelegram({ kind: "lead", id: "x", name: "A", phone: "1" })).resolves.toEqual({
      sent: false,
      reason: "not-configured",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("paneldə bildiriş söndürülübsə göndərmir", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "test-token");
    vi.stubEnv("TELEGRAM_CHAT_ID", "-100");
    settings.value = "0";
    await expect(notifyLeadOnTelegram({ kind: "lead", id: "x", name: "A", phone: "1" })).resolves.toEqual({
      sent: false,
      reason: "disabled",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("konfiqurasiya olunubsa sendMessage çağırır, API xətasını udur", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "test-token");
    vi.stubEnv("TELEGRAM_CHAT_ID", "-100");
    await expect(notifyLeadOnTelegram({ kind: "reservation", id: "r1", name: "A", phone: "1", requestedFor: new Date("2026-10-01T08:00:00Z") })).resolves.toEqual({ sent: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.telegram.org/bottest-token/sendMessage");
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ chat_id: "-100", parse_mode: "HTML" });
    expect(body.text).toContain("baxış sorğusu");

    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 401 }));
    await expect(notifyLeadOnTelegram({ kind: "lead", id: "x", name: "A", phone: "1" })).resolves.toEqual({ sent: false, reason: "failed" });
  });
});
