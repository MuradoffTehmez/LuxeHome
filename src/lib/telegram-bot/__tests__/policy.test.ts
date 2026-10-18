import { describe, expect, it } from "vitest";
import {
  MAX_DELIVERY_ATTEMPTS,
  chatCanPost,
  classifyDelivery,
  escapeTelegramHtml,
  isValidWebhookSecret,
  linkTokenFromPayload,
  maskPhoneForChat,
  parseChatCategories,
  parseCommand,
  parseStartPayload,
  parseTelegramConfig,
  splitMessage,
  supportRateAllowed,
  SUPPORT_MESSAGES_PER_HOUR,
  TELEGRAM_CONFIG_DEFAULTS,
} from "@/lib/telegram-bot/policy";
import { formatNoticeMessage } from "@/lib/telegram-bot/delivery";
import { parseTelegramUpdate } from "@/lib/telegram-bot/updates";
import { formatLeadTelegramMessage } from "@/lib/telegram";

const NOW = new Date("2026-10-18T10:00:00Z");

describe("çatdırılma təsnifatı (403, 429, 5xx)", () => {
  it("uğur", () => {
    expect(classifyDelivery({ ok: true }, 1, NOW)).toEqual({ kind: "sent" });
  });

  it("403 — bot bloklanıb, hədəf bağlanır", () => {
    expect(classifyDelivery({ ok: false, code: 403, description: "Forbidden: bot was blocked by the user" }, 1, NOW)).toEqual({ kind: "blocked", error: "403" });
  });

  it("400 «chat not found» — hədəf bağlanır, digər 400 qəti uğursuzluqdur", () => {
    expect(classifyDelivery({ ok: false, code: 400, description: "Bad Request: chat not found" }, 1, NOW).kind).toBe("blocked");
    expect(classifyDelivery({ ok: false, code: 400, description: "Bad Request: can't parse entities" }, 1, NOW)).toEqual({ kind: "failed", error: "400" });
  });

  it("429 `retry_after`-ə hörmət edir", () => {
    const outcome = classifyDelivery({ ok: false, code: 429, retryAfter: 17 }, 1, NOW);
    expect(outcome).toEqual({ kind: "retry", retryAt: new Date(NOW.getTime() + 17_000), error: "429" });
  });

  it("5xx və şəbəkə xətası eksponensial gözləmə ilə, son cəhddən sonra qəti uğursuzdur", () => {
    const first = classifyDelivery({ ok: false, code: 502 }, 1, NOW);
    const second = classifyDelivery({ ok: false, code: 0, description: "network" }, 2, NOW);
    expect(first.kind).toBe("retry");
    expect(second.kind).toBe("retry");
    if (first.kind === "retry" && second.kind === "retry") expect(second.retryAt.getTime() - NOW.getTime()).toBeGreaterThan(first.retryAt.getTime() - NOW.getTime());
    expect(classifyDelivery({ ok: false, code: 500 }, MAX_DELIVERY_ATTEMPTS, NOW)).toEqual({ kind: "failed", error: "500" });
  });
});

describe("mesaj formatı", () => {
  it("HTML kodlanır — inyeksiya yoxdur", () => {
    expect(escapeTelegramHtml(`<a href="x">&</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;");
    const message = formatNoticeMessage({ title: "<b>Başlıq</b>", content: "<script>x</script>", url: "https://luxehomeestate.az/az/kabinet", settingsUrl: "https://luxehomeestate.az/az/kabinet/bildirisler", locale: "az" });
    expect(message.html).toContain("&lt;b&gt;Başlıq&lt;/b&gt;");
    expect(message.html).not.toContain("<script>");
    expect(message.buttons[0]).toHaveLength(2);
  });

  it("uzun mətn 4096 limitinə sığan hissələrə bölünür", () => {
    const parts = splitMessage(`${"a".repeat(3000)}\n${"b".repeat(3000)}\n${"c".repeat(9000)}`);
    expect(parts.length).toBeGreaterThan(2);
    for (const part of parts) expect(part.length).toBeLessThanOrEqual(4000);
    expect(parts.join("")).toContain("b".repeat(3000));
  });

  it("nömrə maskalanır", () => {
    expect(maskPhoneForChat("+994 50 123 45 67")).toBe("*** 45 67");
  });

  it("əlaqə məlumatı söndürüləndə müraciət xəbərdarlığına ad, e-poçt və mətn düşmür", () => {
    const text = formatLeadTelegramMessage({ kind: "lead", id: "l1", name: "Əli Vəliyev", phone: "+994501234567", email: "a@b.az", message: "Salam" }, { contactInChat: false });
    expect(text).not.toContain("Əli");
    expect(text).not.toContain("a@b.az");
    expect(text).not.toContain("Salam");
    expect(text).toContain("*** 45 67");
    expect(text).toContain("/admin/muracietler/l1");
  });
});

describe("komandalar və deep-link", () => {
  it("`/start l_<token>` payload-u", () => {
    const token = "A".repeat(43);
    expect(parseStartPayload(`/start l_${token}`)).toBe(`l_${token}`);
    expect(linkTokenFromPayload(`l_${token}`)).toBe(token);
    expect(linkTokenFromPayload("l_short")).toBeNull();
    expect(linkTokenFromPayload("x_" + token)).toBeNull();
    expect(parseStartPayload("/start <script>")).toBeNull();
    expect(parseStartPayload("/start")).toBeNull();
  });

  it("başqa botun komandasına cavab verilmir", () => {
    expect(parseCommand("/help", "luxehomeestatebot")).toBe("help");
    expect(parseCommand("/Help@LuxeHomeEstateBot", "luxehomeestatebot")).toBe("help");
    expect(parseCommand("/help@otherbot", "luxehomeestatebot")).toBeNull();
    expect(parseCommand("salam", "luxehomeestatebot")).toBeNull();
  });
});

describe("konfiqurasiya və hədlər", () => {
  it("webhook secret formatı", () => {
    expect(isValidWebhookSecret(undefined)).toBe(false);
    expect(isValidWebhookSecret("short")).toBe(false);
    expect(isValidWebhookSecret("bad secret with spaces!!")).toBe(false);
    expect(isValidWebhookSecret("a".repeat(32))).toBe(true);
  });

  it("pozulmuş parametr defolta qayıdır, naməlum açar atılır", () => {
    expect(parseTelegramConfig("{pozuq")).toEqual(TELEGRAM_CONFIG_DEFAULTS);
    const parsed = parseTelegramConfig(JSON.stringify({ adminAlerts: { LEAD: false, NAMELUM: true }, leadContactInChat: false }));
    expect(parsed.adminAlerts.LEAD).toBe(false);
    expect(parsed.adminAlerts.SYSTEM).toBe(true);
    expect(parsed.leadContactInChat).toBe(false);
    expect(parsed.adminAlerts).not.toHaveProperty("NAMELUM");
  });

  it("qrup/kanal göndəriş icazəsi", () => {
    expect(chatCanPost({ type: "channel", status: "member" })).toBe(false);
    expect(chatCanPost({ type: "channel", status: "administrator", canPostMessages: true })).toBe(true);
    expect(chatCanPost({ type: "supergroup", status: "member" })).toBe(true);
    expect(chatCanPost({ type: "group", status: "kicked" })).toBe(false);
    expect(parseChatCategories(JSON.stringify(["LISTINGS", "HACK"]))).toEqual(["LISTINGS"]);
  });

  it("dəstək mesajı limiti", () => {
    expect(supportRateAllowed(SUPPORT_MESSAGES_PER_HOUR - 1)).toBe(true);
    expect(supportRateAllowed(SUPPORT_MESSAGES_PER_HOUR)).toBe(false);
  });
});

describe("update sxemi", () => {
  it("etibarsız payload rədd olunur, etibarlı qəbul olunur", () => {
    expect(parseTelegramUpdate({ hello: "world" })).toBeNull();
    expect(parseTelegramUpdate({ update_id: -1 })).toBeNull();
    expect(parseTelegramUpdate({ update_id: 1, message: { message_id: 1, chat: { id: 1, type: "weird" } } })).toBeNull();
    const update = parseTelegramUpdate({ update_id: 5, message: { message_id: 1, from: { id: 42, first_name: "A", extra: 1 }, chat: { id: 42, type: "private" }, text: "/start" } });
    expect(update?.message?.from?.id).toBe(42);
    expect(update?.message?.from).not.toHaveProperty("extra");
  });
});
