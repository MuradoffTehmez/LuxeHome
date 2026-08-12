"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "Ad ən azı 2 simvol olmalıdır"),
  phone: z.string().min(7, "Telefon nömrəsi düzgün deyil"),
  email: z.string().email("E-poçt ünvanı düzgün deyil").optional().or(z.literal("")),
  subject: z.string().optional().or(z.literal("")),
  message: z.string().min(10, "Mesaj ən azı 10 simvol olmalıdır"),
});

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

  const result = contactSchema.safeParse(raw);

  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { success: false, fieldErrors };
  }

  try {
    await prisma.lead.create({
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

    return { success: true };
  } catch {
    return {
      success: false,
      error: "Müraciət göndərilərkən xəta baş verdi. Zəhmət olmasa bir az sonra yenidən cəhd edin.",
    };
  }
}
