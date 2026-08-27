import { prisma } from "@/lib/prisma";

export type EmailActivityInput = {
  providerId: string;
  direction: "INBOUND" | "OUTBOUND";
  eventType: string;
  fromAddress?: string | null;
  toAddresses?: string[];
  subject?: string | null;
  messageId?: string | null;
  attachmentCount?: number;
  lastEventAt?: Date;
};

/** Məktub məzmununu saxlamadan çatdırılma/qəbul metadatasını idempotent yazır. */
export async function recordEmailActivity(input: EmailActivityInput): Promise<void> {
  const data = {
    direction: input.direction,
    eventType: input.eventType,
    fromAddress: input.fromAddress ?? null,
    toAddresses: JSON.stringify(input.toAddresses ?? []),
    subject: input.subject ?? null,
    messageId: input.messageId ?? null,
    attachmentCount: input.attachmentCount ?? 0,
    lastEventAt: input.lastEventAt ?? new Date(),
  };
  try {
    await prisma.emailActivity.upsert({
      where: { providerId: input.providerId },
      create: { providerId: input.providerId, ...data },
      update: data,
    });
  } catch (error) {
    console.error("[email] fəaliyyət jurnalı yazılmadı:", error);
  }
}
