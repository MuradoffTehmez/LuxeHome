import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({ leadCreate: vi.fn() }));
const effects = vi.hoisted(() => ({ sendEmail: vi.fn() }));
const guard = vi.hoisted(() => ({
  requestHeaders: new Headers(),
  contactLimitOk: true,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { lead: { create: database.leadCreate } },
}));
vi.mock("@/lib/email", () => ({
  sendLeadNotificationEmail: effects.sendEmail,
}));
// `next/headers` yalnız sorğu kontekstində işləyir; unit testdə başlıqlar əl ilə verilir
vi.mock("next/headers", () => ({
  headers: async () => guard.requestHeaders,
}));
vi.mock("@/lib/auth/rate-limit", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/auth/rate-limit")>()),
  checkContactLimit: async () => guard.contactLimitOk,
}));

import { submitContactForm } from "./actions";
import { HONEYPOT_FIELD } from "@/lib/spam";

function validFormData() {
  const formData = new FormData();
  formData.set("name", "Aysel Məmmədova");
  formData.set("phone", "+994501234567");
  formData.set("email", "aysel@example.az");
  formData.set("subject", "Villa seçimi");
  formData.set("message", "Bakıda villa seçimi üçün məsləhət almaq istəyirəm.");
  return formData;
}

describe("əlaqə forması", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    guard.requestHeaders = new Headers();
    guard.contactLimitOk = true;
    database.leadCreate.mockResolvedValue({
      name: "Aysel Məmmədova",
      phone: "+994501234567",
      email: "aysel@example.az",
      subject: "Villa seçimi",
      message: "Bakıda villa seçimi üçün məsləhət almaq istəyirəm.",
      source: "CONTACT",
    });
    effects.sendEmail.mockResolvedValue(undefined);
  });

  it("düzgün müraciəti saxlayır və uğurlu vəziyyət qaytarır", async () => {
    const result = await submitContactForm({ success: false }, validFormData());

    expect(result).toEqual({ success: true });
    expect(database.leadCreate).toHaveBeenCalledOnce();
    expect(effects.sendEmail).toHaveBeenCalledOnce();
  });

  it("saxlama xətasında istifadəçiyə təhlükəsiz ümumi mesaj qaytarır", async () => {
    database.leadCreate.mockRejectedValue(new Error("database unavailable"));

    const result = await submitContactForm({ success: false }, validFormData());

    expect(result.success).toBe(false);
    expect(result.error).toContain("yenidən cəhd edin");
  });

  it("qısa mətnləri sahə xətası kimi göstərir və bazaya yazmır", async () => {
    const formData = validFormData();
    formData.set("message", "Qısa");

    const result = await submitContactForm({ success: false }, formData);

    expect(result.fieldErrors?.message).toBe("Mesaj ən azı 10 simvol olmalıdır");
    expect(database.leadCreate).not.toHaveBeenCalled();
  });
});

describe("əlaqə forması — spam qapısı", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    guard.requestHeaders = new Headers();
    guard.contactLimitOk = true;
    database.leadCreate.mockResolvedValue({ name: "", phone: "", message: "", source: "CONTACT" });
    effects.sendEmail.mockResolvedValue(undefined);
  });

  it("honeypot doldurulubsa bazaya yazmır", async () => {
    const formData = validFormData();
    formData.set(HONEYPOT_FIELD, "https://spam.example");

    const result = await submitContactForm({ success: false }, formData);

    // Bota uğur cavabı gedir ki, sahənin tələ olduğunu başa düşməsin
    expect(result.success).toBe(true);
    expect(database.leadCreate).not.toHaveBeenCalled();
    expect(effects.sendEmail).not.toHaveBeenCalled();
  });

  it("boş honeypot normal göndərişi bloklamır", async () => {
    const formData = validFormData();
    formData.set(HONEYPOT_FIELD, "");

    const result = await submitContactForm({ success: false }, formData);

    expect(result.success).toBe(true);
    expect(database.leadCreate).toHaveBeenCalledOnce();
  });

  it("kənar saytdan gələn göndərişi rədd edir", async () => {
    guard.requestHeaders = new Headers({ "sec-fetch-site": "cross-site" });

    const result = await submitContactForm({ success: false }, validFormData());

    expect(result.success).toBe(false);
    expect(database.leadCreate).not.toHaveBeenCalled();
  });

  it("origin host ilə uyğun gəlmirsə rədd edir", async () => {
    guard.requestHeaders = new Headers({
      origin: "https://spam.example",
      host: "luxehomeestate.az",
    });

    const result = await submitContactForm({ success: false }, validFormData());

    expect(result.success).toBe(false);
    expect(database.leadCreate).not.toHaveBeenCalled();
  });

  it("sürət limiti aşılıbsa bazaya yazmır", async () => {
    guard.contactLimitOk = false;

    const result = await submitContactForm({ success: false }, validFormData());

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
    expect(database.leadCreate).not.toHaveBeenCalled();
    expect(effects.sendEmail).not.toHaveBeenCalled();
  });
});
