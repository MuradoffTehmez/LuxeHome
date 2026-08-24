"use server";

import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { sendLeadNotificationEmail } from "@/lib/email";
import { z } from "zod";

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

export async function submitContactForm(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
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
        status: "NEW",
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
    return {
      success: false,
      error: "Müraciət göndərilərkən xəta baş verdi. Zəhmət olmasa bir az sonra yenidən cəhd edin.",
    };
  }
}

