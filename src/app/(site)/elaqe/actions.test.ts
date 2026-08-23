import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({ leadCreate: vi.fn() }));
const effects = vi.hoisted(() => ({ sendEmail: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: { lead: { create: database.leadCreate } },
}));
vi.mock("@/lib/email", () => ({
  sendLeadNotificationEmail: effects.sendEmail,
}));

import { submitContactForm } from "./actions";

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
