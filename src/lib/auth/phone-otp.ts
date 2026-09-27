import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/sms";
import { sha256Hex, timingSafeEqual } from "./crypto";
import {
  OTP_MAX_ATTEMPTS,
  OTP_TTL_SECONDS,
  OTP_WINDOW_SECONDS,
  generateOtpCode,
  otpSendDecision,
  type OtpSendDecision,
} from "./phone-otp-policy";

/**
 * Telefon OTP-si (#109). Kod bazada yalnız `AUTH_SECRET` ilə bağlanmış hash kimi
 * saxlanılır: 6 rəqəm az entropiyalıdır və baza sızsa, sirsiz hash offline sınanardı.
 * Hər kod 5 dəqiqə və 5 cəhd üçün etibarlıdır, yeni kod köhnələri etibarsız edir.
 */

export const OTP_PURPOSES = { LOGIN: "LOGIN", VERIFY: "VERIFY" } as const;
export type OtpPurpose = (typeof OTP_PURPOSES)[keyof typeof OTP_PURPOSES];

/** Kodun saxlanan hash-ı — testlər də eyni formulu işlədir. */
export async function otpCodeHash(phone: string, purpose: OtpPurpose, code: string): Promise<string> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET təyin edilməyib");
  return sha256Hex(`${secret}|otp|${purpose}|${phone}|${code}`);
}

const MESSAGES: Record<string, (code: string) => string> = {
  az: (code) => `Luxe Home Estate təsdiq kodu: ${code}. Kodu heç kimə deməyin.`,
  en: (code) => `Luxe Home Estate verification code: ${code}. Do not share it with anyone.`,
  ru: (code) => `Код подтверждения Luxe Home Estate: ${code}. Никому его не сообщайте.`,
};

/**
 * Kod yaradıb göndərir. Limit aşılıbsa göndərmir; `SEND` olsa belə SMS xətası
 * çağırana `false` kimi qayıdır.
 */
export async function issuePhoneOtp(input: {
  phone: string;
  purpose: OtpPurpose;
  userId: string | null;
  locale: string;
  now?: Date;
}): Promise<{ decision: OtpSendDecision; sent: boolean }> {
  const now = input.now ?? new Date();
  const recent = await prisma.phoneOtp.findMany({
    where: { phone: input.phone, createdAt: { gte: new Date(now.getTime() - OTP_WINDOW_SECONDS * 1000) } },
    select: { createdAt: true },
  });
  const decision = otpSendDecision(recent.map((row) => row.createdAt), now);
  if (decision !== "SEND") return { decision, sent: false };

  // Yeni kod əvvəlkiləri etibarsız edir — eyni anda yalnız bir kod işləyir.
  await prisma.phoneOtp.updateMany({
    where: { phone: input.phone, purpose: input.purpose, consumedAt: null },
    data: { consumedAt: now },
  });
  const code = generateOtpCode();
  await prisma.phoneOtp.create({
    data: {
      phone: input.phone,
      purpose: input.purpose,
      userId: input.userId,
      codeHash: await otpCodeHash(input.phone, input.purpose, code),
      expiresAt: new Date(now.getTime() + OTP_TTL_SECONDS * 1000),
      createdAt: now,
    },
  });
  const text = (MESSAGES[input.locale] ?? MESSAGES.az)(code);
  return { decision, sent: await sendSms(input.phone, text) };
}

/**
 * Kodu yoxlayır. Uğurda kod istifadə olunmuş sayılır və onun `userId`-si qaytarılır.
 * Hər səhv cəhd sayılır; həddə çatan kod işləməz olur.
 */
export async function consumePhoneOtp(input: {
  phone: string;
  purpose: OtpPurpose;
  code: string;
  now?: Date;
}): Promise<{ ok: true; userId: string | null } | { ok: false; reason: "invalid" | "expired" }> {
  const now = input.now ?? new Date();
  const otp = await prisma.phoneOtp.findFirst({
    where: { phone: input.phone, purpose: input.purpose, consumedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, codeHash: true, attempts: true, expiresAt: true, userId: true },
  });
  if (!otp || otp.expiresAt <= now || otp.attempts >= OTP_MAX_ATTEMPTS) return { ok: false, reason: "expired" };

  const expected = new TextEncoder().encode(otp.codeHash);
  const received = new TextEncoder().encode(await otpCodeHash(input.phone, input.purpose, input.code.replace(/\D/g, "")));
  if (!timingSafeEqual(expected, received)) {
    // Şərtli artım: paralel cəhdlər həddi keçə bilməz.
    await prisma.phoneOtp.updateMany({ where: { id: otp.id, attempts: { lt: OTP_MAX_ATTEMPTS } }, data: { attempts: { increment: 1 } } });
    return { ok: false, reason: "invalid" };
  }
  // Eyni kodun iki dəfə işlədilməsinin qarşısı: yalnız biri `consumedAt`-i yaza bilir.
  const claimed = await prisma.phoneOtp.updateMany({ where: { id: otp.id, consumedAt: null }, data: { consumedAt: now } });
  if (claimed.count === 0) return { ok: false, reason: "expired" };
  return { ok: true, userId: otp.userId };
}
