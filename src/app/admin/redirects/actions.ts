"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/constants";
import {
  type ActionState,
  failure,
  invalid,
  success,
  unexpected,
} from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import { redirectCreateSchema } from "@/lib/admin/schemas";
import * as form from "@/lib/admin/form";
import { findRedirectChain } from "@/lib/serp";

const LIST_PATH = "/admin/redirects";

export async function createRedirect(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.SEO_REDIRECT_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const parsed = redirectCreateSchema.safeParse({
    fromPath: form.text(formData, "fromPath"),
    toPath: form.text(formData, "toPath"),
    statusCode: form.integer(formData, "statusCode") ?? 301,
  });
  if (!parsed.success) return invalid(parsed.error);

  if (parsed.data.fromPath === parsed.data.toPath) {
    return failure("Köhnə və yeni ünvan eyni ola bilməz.", { toPath: "Fərqli ünvan seçin" });
  }

  try {
    const existing = await prisma.redirect.findUnique({
      where: { fromPath: parsed.data.fromPath },
      select: { id: true },
    });
    if (existing) {
      return failure("Bu ünvan üçün artıq yönləndirmə var.", { fromPath: "Artıq mövcuddur" });
    }
    const activeRules = await prisma.redirect.findMany({
      where: { isActive: true },
      select: { fromPath: true, toPath: true, isActive: true },
    });
    const chain = findRedirectChain(parsed.data.fromPath, parsed.data.toPath, activeRules);
    if (chain) {
      return failure(`Redirect chain/loop yarana bilər: ${chain.join(" → ")}. Son canonical ünvana birbaşa yönləndirin.`);
    }

    const redirect = await prisma.redirect.create({
      data: { ...parsed.data, createdBy: actor.email },
      select: { id: true },
    });

    // Eyni yol üzrə yığılmış 404 qeydi artıq lazımsızdır
    await prisma.notFoundHit.deleteMany({ where: { path: parsed.data.fromPath } });

    await recordAudit(
      actor,
      "CREATE",
      "Redirect",
      redirect.id,
      `${parsed.data.fromPath} → ${parsed.data.toPath}`,
    );
    revalidatePath(LIST_PATH);
    return success("Yönləndirmə əlavə edildi.");
  } catch (error) {
    return unexpected("yönləndirmə yaradıla bilmədi", error);
  }
}

export async function toggleRedirectActive(id: string): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.SEO_REDIRECT_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const redirect = await prisma.redirect.findUnique({
      where: { id },
      select: { fromPath: true, isActive: true },
    });
    if (!redirect) return failure("Yönləndirmə tapılmadı.");

    await prisma.redirect.update({ where: { id }, data: { isActive: !redirect.isActive } });
    await recordAudit(
      actor,
      "UPDATE",
      "Redirect",
      id,
      `${redirect.fromPath} — ${redirect.isActive ? "deaktiv edildi" : "aktivləşdirildi"}`,
    );
    revalidatePath(LIST_PATH);
    return success("Yönləndirmə yeniləndi.");
  } catch (error) {
    return unexpected("yönləndirmə yenilənmədi", error);
  }
}

export async function deleteRedirect(id: string): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.SEO_REDIRECT_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const redirect = await prisma.redirect.delete({ where: { id }, select: { fromPath: true } });
    await recordAudit(actor, "DELETE", "Redirect", id, redirect.fromPath);
    revalidatePath(LIST_PATH);
    return success("Yönləndirmə silindi.");
  } catch (error) {
    return unexpected("yönləndirmə silinmədi", error);
  }
}

/** 404 siyahısındakı bir yolu birbaşa yönləndirmə formuna köçürmək üçün silinir. */
export async function dismissNotFoundHit(id: string): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.SEO_REDIRECT_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const hit = await prisma.notFoundHit.delete({ where: { id }, select: { path: true } });
    await recordAudit(actor, "DELETE", "Redirect", id, `404 qeydi silindi: ${hit.path}`);
    revalidatePath(LIST_PATH);
    return success("404 qeydi silindi.");
  } catch (error) {
    return unexpected("404 qeydi silinmədi", error);
  }
}
