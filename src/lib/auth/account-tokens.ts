import { prisma } from "@/lib/prisma";
import { sha256Hex, toBase64Url } from "./crypto";

const VERIFY_LIFETIME_MS = 24 * 60 * 60 * 1000;
const RESET_LIFETIME_MS = 60 * 60 * 1000;

function randomToken(): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

export async function issueEmailVerificationToken(userId: string): Promise<string> {
  const token = randomToken();
  await prisma.emailVerificationToken.deleteMany({ where: { userId, usedAt: null } });
  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash: await sha256Hex(token),
      expiresAt: new Date(Date.now() + VERIFY_LIFETIME_MS),
    },
  });
  return token;
}

export async function consumeEmailVerificationToken(token: string): Promise<boolean> {
  if (token.length < 32 || token.length > 200) return false;
  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: await sha256Hex(token) },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });
  if (!record || record.usedAt || record.expiresAt <= new Date()) return false;

  const consumed = await prisma.emailVerificationToken.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (consumed.count !== 1) return false;
  await prisma.user.update({
    where: { id: record.userId },
    data: { emailVerifiedAt: new Date() },
  });
  return true;
}

export async function issuePasswordResetToken(userId: string): Promise<string> {
  const token = randomToken();
  await prisma.passwordResetToken.deleteMany({ where: { userId, usedAt: null } });
  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash: await sha256Hex(token),
      expiresAt: new Date(Date.now() + RESET_LIFETIME_MS),
    },
  });
  return token;
}

export async function consumePasswordResetToken(token: string): Promise<string | null> {
  if (token.length < 32 || token.length > 200) return null;
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: await sha256Hex(token) },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });
  if (!record || record.usedAt || record.expiresAt <= new Date()) return null;
  const consumed = await prisma.passwordResetToken.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  return consumed.count === 1 ? record.userId : null;
}
