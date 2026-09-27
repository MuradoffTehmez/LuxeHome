"use server";

import { revalidatePath } from "next/cache";
import type { PublicKeyCredentialCreationOptionsJSON, RegistrationResponseJSON } from "@simplewebauthn/server";
import { requireStaff } from "@/lib/auth/guard";
import { assertSameOrigin } from "@/lib/admin/guard";
import { recordAudit } from "@/lib/admin/audit";
import { failure, success, unexpected, type ActionState } from "@/lib/admin/action-state";
import { msg, type ServerMessageKey } from "@/lib/admin/server-message";
import { PasskeyError, passkeyRegistrationOptions, registerPasskey } from "@/lib/auth/passkey";
import { sendEmail } from "@/lib/email";
import { escapeHtml } from "@/lib/email-html";
import { prisma } from "@/lib/prisma";

/**
 * Passkey idarəsi (#109). Hər action öz guard-ını çağırır; yeni açar əlavə olunanda
 * hesab sahibinə məktub gedir — sessiyası oğurlanmış hesabda gizli açar qalmasın.
 */

const PATH = "/admin/hesabim";

const ERROR_KEYS: Record<PasskeyError["code"], ServerMessageKey> = {
  "unsupported-host": "server.hesabim.passkeyHost",
  limit: "server.hesabim.passkeyLimit",
  challenge: "server.hesabim.passkeyExpired",
  verification: "server.hesabim.passkeyFailed",
  "unknown-credential": "server.hesabim.passkeyFailed",
};

export type PasskeyRegistrationStart =
  | { status: "ok"; options: PublicKeyCredentialCreationOptionsJSON }
  | { status: "error"; message: string };

export async function beginPasskeyRegistration(): Promise<PasskeyRegistrationStart> {
  await assertSameOrigin();
  const user = await requireStaff();
  try {
    return { status: "ok", options: await passkeyRegistrationOptions(user) };
  } catch (error) {
    if (error instanceof PasskeyError) return { status: "error", message: msg(ERROR_KEYS[error.code]) };
    throw error;
  }
}

export async function finishPasskeyRegistration(response: RegistrationResponseJSON, name: string): Promise<ActionState> {
  await assertSameOrigin();
  const user = await requireStaff();
  let passkey;
  try {
    passkey = await registerPasskey(user.id, response, name, "Passkey");
  } catch (error) {
    if (error instanceof PasskeyError) return failure(msg(ERROR_KEYS[error.code]));
    return unexpected("passkey yadda saxlanmadı", error, msg("server.common.unexpected"));
  }
  await recordAudit(user, "UPDATE", "User", user.id, `Passkey əlavə edildi: ${passkey.name}`);
  await sendEmail({
    to: user.email,
    subject: "Hesabınıza yeni passkey əlavə edildi",
    html:
      `<p>Luxe Home Estate idarə panelindəki hesabınıza «${escapeHtml(passkey.name)}» adlı yeni passkey əlavə edildi.</p>` +
      "<p>Bunu siz etməmisinizsə, dərhal «Hesabım» bölməsində passkey-i silin, parolu dəyişin və bütün sessiyaları bağlayın.</p>",
  }).catch(() => undefined);
  revalidatePath(PATH);
  return success(msg("server.hesabim.passkeyAdded"));
}

export async function deletePasskey(id: string): Promise<ActionState> {
  await assertSameOrigin();
  const user = await requireStaff();
  try {
    // Yalnız öz açarı — başqasının ID-si göndərilsə heç nə silinmir.
    const removed = await prisma.passkey.deleteMany({ where: { id, userId: user.id } });
    if (removed.count === 0) return failure(msg("server.hesabim.passkeyNotFound"));
    await recordAudit(user, "UPDATE", "User", user.id, "Passkey silindi");
    revalidatePath(PATH);
    return success(msg("server.hesabim.passkeyDeleted"));
  } catch (error) {
    return unexpected("passkey silinmədi", error, msg("server.common.unexpected"));
  }
}
