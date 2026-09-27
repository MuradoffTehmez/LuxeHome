"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordAudit } from "@/lib/admin/audit";
import { failure, invalid, success, unexpected, type ActionState } from "@/lib/admin/action-state";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import { msg, type ServerMessageKey } from "@/lib/admin/server-message";
import { PAYMENT_METHODS, PERMISSIONS, type PaymentMethod } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import { MAX_PACKAGE_DURATION_DAYS, parseMoneyToMinor } from "@/lib/package-math";
import {
  activateOrder,
  cancelOrder,
  createAdminOrder,
  markOrderPaid,
  refundOrder,
  type OrderFailure,
} from "@/lib/packages";

/**
 * Paketlər və ödəniş uçotu (#109). Hər action öz guard-ını çağırır — server action-lar
 * layout-dan keçmir və birbaşa POST ilə çağırıla bilir.
 */

const PATH = "/admin/paketler";

const FAILURE_KEYS: Record<OrderFailure, ServerMessageKey> = {
  "not-found": "server.packages.orderNotFound",
  "package-inactive": "server.packages.packageUnavailable",
  "property-unavailable": "server.packages.propertyUnavailable",
  "too-many-pending": "server.packages.invalidStatus",
  "duplicate-pending": "server.packages.invalidStatus",
  "invalid-status": "server.packages.invalidStatus",
};

async function guard() {
  try {
    return { actor: await requireAdminAction(PERMISSIONS.BILLING_MANAGE) };
  } catch (error) {
    if (error instanceof AdminGuardError) return { error: failure(error.message) };
    throw error;
  }
}

const optionalTrimmed = (max: number) =>
  z.string().trim().max(max).optional().transform((value) => (value ? value : null));

const packageSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(80),
  description: optionalTrimmed(300),
  durationDays: z.coerce.number().int().min(1).max(MAX_PACKAGE_DURATION_DAYS),
  price: z.string().transform((value, ctx) => {
    const minor = parseMoneyToMinor(value);
    if (minor === null || minor <= 0) {
      ctx.addIssue({ code: "custom", message: "price" });
      return z.NEVER;
    }
    return minor;
  }),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export async function savePackage(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const guarded = await guard();
  if (guarded.error) return guarded.error;
  const parsed = packageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error, msg("server.common.formInvalid"));
  const { id, price, ...data } = parsed.data;
  try {
    const saved = id
      ? await prisma.listingPackage.update({ where: { id }, data: { ...data, priceMinor: price }, select: { id: true } })
      : await prisma.listingPackage.create({ data: { ...data, priceMinor: price }, select: { id: true } });
    await recordAudit(guarded.actor, id ? "UPDATE" : "CREATE", "ListingPackage", saved.id, `${data.name} — ${data.durationDays} gün`);
    revalidatePath(PATH);
    return success(msg(id ? "server.packages.packageUpdated" : "server.packages.packageCreated"));
  } catch (error) {
    return unexpected("paket yadda saxlanmadı", error, msg("server.common.unexpected"));
  }
}

/** Paketi satışdan çıxarır və ya qaytarır. Keçmiş sifarişlər toxunulmaz qalır. */
export async function togglePackage(id: string): Promise<ActionState> {
  const guarded = await guard();
  if (guarded.error) return guarded.error;
  try {
    const current = await prisma.listingPackage.findUnique({ where: { id }, select: { isActive: true, name: true } });
    if (!current) return failure(msg("server.packages.packageUnavailable"));
    await prisma.listingPackage.update({ where: { id }, data: { isActive: !current.isActive } });
    await recordAudit(guarded.actor, "UPDATE", "ListingPackage", id, `${current.name} — ${current.isActive ? "satışdan çıxarıldı" : "satışa qaytarıldı"}`);
    revalidatePath(PATH);
    return success(msg(current.isActive ? "server.packages.packageDisabled" : "server.packages.packageEnabled"));
  } catch (error) {
    return unexpected("paket statusu dəyişmədi", error, msg("server.common.unexpected"));
  }
}

const paymentMethod = z.enum(Object.values(PAYMENT_METHODS) as [PaymentMethod, ...PaymentMethod[]]);

const orderSchema = z.object({
  packageId: z.string().min(1),
  propertyId: z.string().min(1),
  customerName: z.string().trim().min(2).max(120),
  customerPhone: optionalTrimmed(40),
  note: optionalTrimmed(500),
  paid: z.literal("on").optional(),
  paymentMethod: paymentMethod.optional(),
  paymentReference: optionalTrimmed(120),
});

export async function createOrder(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const guarded = await guard();
  if (guarded.error) return guarded.error;
  const parsed = orderSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error, msg("server.common.formInvalid"));
  const input = parsed.data;
  if (input.paid && !input.paymentMethod) {
    return failure(msg("server.common.formInvalid"), { paymentMethod: msg("server.packages.methodRequired") });
  }
  try {
    const result = await createAdminOrder({
      packageId: input.packageId,
      propertyId: input.propertyId,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      note: input.note,
      recordedById: guarded.actor.id,
      payment: input.paid && input.paymentMethod
        ? { method: input.paymentMethod, reference: input.paymentReference }
        : null,
    });
    if (!result.ok) return failure(msg(FAILURE_KEYS[result.reason]));
    await recordAudit(guarded.actor, "CREATE", "PackageOrder", result.orderId, `${input.customerName} — ${input.paid ? "ödənilib" : "gözləyir"}`);
    revalidatePath(PATH);
    if (result.activated) revalidatePublicContent("property");
    return success(msg(result.activated ? "server.packages.orderPaidActivated" : input.paid ? "server.packages.orderPaidPending" : "server.packages.orderCreated"));
  } catch (error) {
    return unexpected("sifariş yaradılmadı", error, msg("server.common.unexpected"));
  }
}

const paymentSchema = z.object({
  id: z.string().min(1),
  paymentMethod,
  paymentReference: optionalTrimmed(120),
});

export async function recordPayment(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const guarded = await guard();
  if (guarded.error) return guarded.error;
  const parsed = paymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error, msg("server.common.formInvalid"));
  try {
    const result = await markOrderPaid(
      parsed.data.id,
      { method: parsed.data.paymentMethod, reference: parsed.data.paymentReference },
      guarded.actor.id,
    );
    if (!result.ok) return failure(msg(FAILURE_KEYS[result.reason]));
    await recordAudit(guarded.actor, "UPDATE", "PackageOrder", parsed.data.id, `ödəniş qeydə alındı (${parsed.data.paymentMethod})`);
    revalidatePath(PATH);
    if (result.activated) revalidatePublicContent("property");
    return success(msg(result.activated ? "server.packages.orderPaidActivated" : "server.packages.orderPaidPending"));
  } catch (error) {
    return unexpected("ödəniş qeydə alınmadı", error, msg("server.common.unexpected"));
  }
}

export async function activatePackageOrder(id: string): Promise<ActionState> {
  const guarded = await guard();
  if (guarded.error) return guarded.error;
  try {
    const result = await activateOrder(id);
    if (!result.ok) return failure(msg(FAILURE_KEYS[result.reason]));
    await recordAudit(guarded.actor, "UPDATE", "PackageOrder", id, "premium tətbiq olundu");
    revalidatePath(PATH);
    revalidatePublicContent("property", result.propertySlug);
    return success(msg("server.packages.orderActivated"));
  } catch (error) {
    return unexpected("premium tətbiq olunmadı", error, msg("server.common.unexpected"));
  }
}

export async function cancelPackageOrder(id: string): Promise<ActionState> {
  const guarded = await guard();
  if (guarded.error) return guarded.error;
  try {
    const result = await cancelOrder(id);
    if (!result.ok) return failure(msg(FAILURE_KEYS[result.reason]));
    await recordAudit(guarded.actor, "UPDATE", "PackageOrder", id, "sifariş ləğv edildi");
    revalidatePath(PATH);
    return success(msg("server.packages.orderCancelled"));
  } catch (error) {
    return unexpected("sifariş ləğv edilmədi", error, msg("server.common.unexpected"));
  }
}

export async function refundPackageOrder(id: string): Promise<ActionState> {
  const guarded = await guard();
  if (guarded.error) return guarded.error;
  try {
    const result = await refundOrder(id, guarded.actor.id);
    if (!result.ok) return failure(msg(FAILURE_KEYS[result.reason]));
    await recordAudit(guarded.actor, "UPDATE", "PackageOrder", id, "ödəniş geri qaytarıldı");
    revalidatePath(PATH);
    if (result.propertySlug) revalidatePublicContent("property", result.propertySlug);
    return success(msg("server.packages.orderRefunded"));
  } catch (error) {
    return unexpected("geri qaytarma qeydə alınmadı", error, msg("server.common.unexpected"));
  }
}
