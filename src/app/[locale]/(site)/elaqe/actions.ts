"use server";

import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { sendLeadNotificationEmail } from "@/lib/email";
import { SameOriginError, assertSameOrigin } from "@/lib/request-origin";
import { checkContactLimit, clientIp } from "@/lib/auth/rate-limit";
import { HONEYPOT_FIELD, isHoneypotFilled } from "@/lib/spam";
import { z } from "zod";
import { verifyTurnstile } from "@/lib/auth/turnstile";
import { readLeadAttribution } from "@/lib/lead-attribution";
import { LEAD_STATUSES } from "@/lib/constants";

async function contactSchema() {
  let nameMin = "Ad ən azı 2 simvol olmalıdır";
  let phoneMin = "Telefon nömrəsi düzgün deyil";
  let emailInvalid = "E-poçt ünvanı düzgün deyil";
  let messageMin = "Mesaj ən azı 10 simvol olmalıdır";
  try {
    const t = await getTranslations("validation");
    nameMin = t("nameMin");
    phoneMin = t("phoneMin");
    emailInvalid = t("emailInvalid");
    messageMin = t("messageMin");
  } catch {
    // Request kontekstindən kənarda (məs. unit testlər) standart azərbaycanca mesajlar istifadə olunur
  }

  return z.object({
    name: z.string().min(2, nameMin),
    phone: z.string().min(7, phoneMin),
    email: z.string().email(emailInvalid).optional().or(z.literal("")),
    subject: z.string().optional().or(z.literal("")),
    message: z.string().min(10, messageMin),
  });
}

export type ContactFormState = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

/** Spam qapısının rədd mesajları — tərcümə yoxdursa azərbaycancaya düşür. */
async function rejectionMessage(kind: "origin" | "rateLimited" | "turnstile"): Promise<string> {
  const fallback =
    kind === "origin"
      ? "Müraciət qəbul edilmədi. Səhifəni yeniləyib yenidən cəhd edin."
      : kind === "rateLimited"
        ? "Çox sayda müraciət göndərildi. Bir dəqiqə gözləyin."
        : "Təhlükəsizlik yoxlaması tamamlanmadı. Yenidən cəhd edin.";
  try {
    return (await getTranslations("validation"))(kind);
  } catch {
    return fallback;
  }
}

export async function submitContactForm(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  // --- Spam qapısı ----------------------------------------------------------
  //
  // Üç laylıdır və sıra vacibdir: ən ucuz yoxlama əvvəldədir.
  //
  // 1. Honeypot — heç bir şəbəkə və ya DB müraciəti tələb etmir.
  // 2. Mənbə (CSRF) — yalnız başlıq oxumasıdır.
  // 3. Sürət limiti — Workers binding-i, D1-ə toxunmur.
  //
  // Bunlar olmadan bir skript `Lead` cədvəlini limitsiz doldura və hər sətir
  // üçün Resend e-poçtu tetikleyə bilirdi.

  if (isHoneypotFilled(formData.get(HONEYPOT_FIELD))) {
    // Bota uğur cavabı qaytarılır — sahənin tələ olduğunu bilməsin
    return { success: true };
  }

  try {
    await assertSameOrigin();
  } catch (error) {
    if (error instanceof SameOriginError) {
      return { success: false, error: await rejectionMessage("origin") };
    }
    throw error;
  }

  const ip = clientIp(await headers());
  if (!(await checkContactLimit(ip))) {
    return { success: false, error: await rejectionMessage("rateLimited") };
  }
  if (!(await verifyTurnstile(formData, "contact", ip))) {
    return { success: false, error: await rejectionMessage("turnstile") };
  }

  const raw = {
    name: formData.get("name") as string,
    phone: formData.get("phone") as string,
    email: formData.get("email") as string,
    subject: formData.get("subject") as string,
    message: formData.get("message") as string,
  };

  const schema = await contactSchema();
  const result = schema.safeParse(raw);

  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { success: false, fieldErrors };
  }

  try {
    const lead = await prisma.lead.create({
      data: {
        name: result.data.name,
        phone: result.data.phone,
        email: result.data.email || null,
        subject: result.data.subject || null,
        message: result.data.message,
        source: "CONTACT",
        status: LEAD_STATUSES.NEW,
        ...readLeadAttribution(formData),
      },
    });

    // Resend vasitəsilə bildiriş göndər
    try {
      await sendLeadNotificationEmail({
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        subject: lead.subject,
        message: lead.message,
        source: lead.source,
      });
    } catch (emailErr) {
      console.error("E-poçt bildirişi göndərilərkən xəta:", emailErr);
    }

    return { success: true };
  } catch {
    let error = "Müraciət göndərilərkən xəta baş verdi. Zəhmət olmasa bir az sonra yenidən cəhd edin.";
    try {
      error = (await getTranslations("contact"))("error");
    } catch {
      // Test/request konteksti olmadıqda təhlükəsiz AZ fallback saxlanılır.
    }
    return {
      success: false,
      error,
    };
  }
}

