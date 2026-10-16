import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({ leadCreate: vi.fn(), propertyFindFirst: vi.fn() }));
const effects = vi.hoisted(() => ({
  sendEmail: vi.fn(),
  telegram: vi.fn(),
  listerNotice: vi.fn(),
  routedNotice: vi.fn(),
  agencyNotice: vi.fn(),
}));
const guard = vi.hoisted(() => ({
  requestHeaders: new Headers(),
  contactLimitOk: true,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { lead: { create: database.leadCreate }, property: { findFirst: database.propertyFindFirst } },
}));
vi.mock("@/lib/accounts/account-notices", () => ({
  noticeListingLead: effects.listerNotice,
  noticeLeadRouted: effects.routedNotice,
  noticeAgencyLead: effects.agencyNotice,
}));
// Bölgü məntiqi öz testindədir (`lead-routing.integration.test.ts`); burada ünvan sadəcə ötürülür.
vi.mock("@/lib/accounts/lead-routing", () => ({
  routePropertyLead: async (property: { listerId: string | null }) => ({
    handlerId: property.listerId,
    agencyId: null,
    agencyName: null,
    routed: false,
  }),
  routeAgencyLead: async (slug: string) =>
    slug === "alfa" ? { handlerId: "agent-1", agencyId: "agency-1", agencyName: "Alfa", routed: true } : null,
}));
vi.mock("@/lib/email", () => ({
  sendLeadNotificationEmail: effects.sendEmail,
}));
vi.mock("@/lib/telegram", () => ({
  notifyLeadOnTelegram: effects.telegram,
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
    expect(effects.telegram).toHaveBeenCalledWith(expect.objectContaining({ kind: "lead", phone: "+994501234567" }));
  });

  it("mənbəni allowlist ilə yazır: OWNER qəbul olunur, naməlum dəyər CONTACT olur", async () => {
    const owner = validFormData();
    owner.set("source", "OWNER");
    await submitContactForm({ success: false }, owner);
    expect(database.leadCreate.mock.calls[0][0].data.source).toBe("OWNER");

    const forged = validFormData();
    forged.set("source", "ADMIN");
    await submitContactForm({ success: false }, forged);
    expect(database.leadCreate.mock.calls[1][0].data.source).toBe("CONTACT");
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

  // Hədsiz uzun mətn həm `Lead` sətrini, həm də bildiriş məktubunu şişirdirdi.
  it("hədləri aşan sahələri rədd edir", async () => {
    const formData = validFormData();
    formData.set("message", "ə".repeat(4_001));

    const result = await submitContactForm({ success: false }, formData);

    expect(result.success).toBe(false);
    expect(result.fieldErrors?.message).toBeTruthy();
    expect(database.leadCreate).not.toHaveBeenCalled();
  });

  it("hədd daxilindəki uzun mətni qəbul edir", async () => {
    const formData = validFormData();
    formData.set("message", "ə".repeat(4_000));

    const result = await submitContactForm({ success: false }, formData);

    expect(result.success).toBe(true);
    expect(database.leadCreate).toHaveBeenCalledOnce();
  });
});

describe("əlaqə forması — elan müraciəti", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    guard.requestHeaders = new Headers();
    guard.contactLimitOk = true;
    database.leadCreate.mockImplementation(async ({ data }) => ({ id: "lead-1", ...data }));
  });

  it("sahibin elanına gələn müraciəti elana bağlayır və ofisə deyil, sahibə göndərir", async () => {
    database.propertyFindFirst.mockResolvedValue({
      id: "prop-1",
      title: "Yasamalda 3 otaqlı mənzil",
      authorId: "owner-1",
      status: "PUBLISHED",
      author: { accountType: "OWNER", isActive: true },
    });
    const formData = validFormData();
    formData.set("propertyId", "prop-1");

    await expect(submitContactForm({ success: false }, formData)).resolves.toEqual({ success: true });

    expect(database.leadCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ propertyId: "prop-1", source: "PROPERTY" }),
    });
    expect(effects.listerNotice).toHaveBeenCalledWith(expect.objectContaining({ userId: "owner-1", leadId: "lead-1" }));
    expect(effects.sendEmail).not.toHaveBeenCalled();
    expect(effects.telegram).not.toHaveBeenCalled();
  });

  it("şirkət elanına gələn müraciət ofisə gedir və elana bağlanır", async () => {
    database.propertyFindFirst.mockResolvedValue({
      id: "prop-2",
      title: "Villa",
      authorId: "staff-1",
      status: "PUBLISHED",
      author: { accountType: "STAFF", isActive: true },
    });
    const formData = validFormData();
    formData.set("propertyId", "prop-2");

    await submitContactForm({ success: false }, formData);

    expect(database.leadCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ propertyId: "prop-2", source: "PROPERTY" }),
    });
    expect(effects.listerNotice).not.toHaveBeenCalled();
    expect(effects.telegram).toHaveBeenCalled();
  });

  it("agentlik profilindəki müraciəti agentliyə yazır və bölgü ilə seçilən agentə bildirir", async () => {
    const formData = validFormData();
    formData.set("agency", "alfa");

    await submitContactForm({ success: false }, formData);

    expect(database.leadCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ source: "AGENCY", agencyId: "agency-1", handlerId: "agent-1", propertyId: null }),
    });
    expect(effects.routedNotice).toHaveBeenCalledWith(expect.objectContaining({ userId: "agent-1", agencyName: "Alfa" }));
    expect(effects.telegram).not.toHaveBeenCalled();
  });

  it("naməlum agentlik slug-ı ümumi müraciət kimi ofisə gedir", async () => {
    const formData = validFormData();
    formData.set("agency", "yoxdur");

    await submitContactForm({ success: false }, formData);

    expect(database.leadCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ source: "CONTACT", agencyId: null, handlerId: null }),
    });
    expect(effects.telegram).toHaveBeenCalled();
  });

  it("satılmış elana müraciəti rədd edir — ofisə səssizcə yönəltmir (#202)", async () => {
    database.propertyFindFirst.mockResolvedValue({
      id: "prop-3",
      title: "Satılmış mənzil",
      authorId: "owner-1",
      status: "SOLD",
      author: { accountType: "OWNER", isActive: true },
    });
    const formData = validFormData();
    formData.set("propertyId", "prop-3");

    const result = await submitContactForm({ success: false }, formData);

    expect(result.success).toBe(false);
    expect(database.leadCreate).not.toHaveBeenCalled();
  });

  it("ictimai olmayan elan id-sini nəzərə almır", async () => {
    database.propertyFindFirst.mockResolvedValue(null);
    const formData = validFormData();
    formData.set("propertyId", "gizli-elan");

    await submitContactForm({ success: false }, formData);

    expect(database.leadCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ propertyId: null, source: "CONTACT" }),
    });
  });
});
