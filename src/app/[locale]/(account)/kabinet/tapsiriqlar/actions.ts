"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { type ActionState, failure, success, unexpected } from "@/lib/admin/action-state";
import { AdminGuardError, requirePublicAction } from "@/lib/admin/guard";
import { localizePath } from "@/i18n/path-locale";
import { getAgencyAccess } from "@/lib/accounts/agency-access";
import { createAgencyTask, updateAgencyTaskStatus } from "@/lib/accounts/agency-tasks";
import { recordAgencyActivity } from "@/lib/accounts/agency-activity";
import { noticeAgencyTask } from "@/lib/accounts/account-notices";
import { AGENCY_ACTIVITY_ACTIONS, AGENCY_TASK_STATUSES, type Locale } from "@/lib/constants";

const PAGE = "/kabinet/tapsiriqlar";

function text(value: FormDataEntryValue | null, max = 2000): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** Tapşırıq yaradır (#220, PRD 7.3): idarəçi istənilən aktiv üzvə, digər üzv yalnız özünə. */
export async function createTask(_state: ActionState, formData: FormData): Promise<ActionState> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("account");
  let user;
  try {
    user = await requirePublicAction("team", locale);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(t("actions.actionUnavailable"));
    throw error;
  }
  try {
    const access = await getAgencyAccess(user);
    const title = text(formData.get("title"), 300);
    const result = await createAgencyTask({
      access,
      actorId: user.id,
      title,
      description: text(formData.get("description")) || null,
      type: text(formData.get("type"), 40),
      assigneeId: text(formData.get("assignee"), 40) || null,
      propertyId: text(formData.get("property"), 40) || null,
      leadId: text(formData.get("lead"), 64) || null,
      dueDate: text(formData.get("due"), 10) || null,
    });
    if (result.result !== "created") {
      const field = { invalidTitle: "title", invalidType: "type", invalidAssignee: "assignee", invalidDue: "due", invalidProperty: "property", invalidLead: "lead", forbidden: "title" }[result.result];
      const message = t(`tasks.errors.${result.result}`);
      return failure(message, { [field]: message });
    }
    if (access) {
      await recordAgencyActivity({
        agencyId: access.agencyId, actor: user, action: AGENCY_ACTIVITY_ACTIONS.TASK_CREATED,
        entityType: "AgencyTask", entityId: result.id, entityLabel: title,
      });
      if (result.assigneeId !== user.id) {
        await noticeAgencyTask({ userId: result.assigneeId, taskId: result.id, stage: "assigned", taskTitle: title, agencyName: access.agencyName, actorName: user.name });
      }
    }
  } catch (error) {
    return unexpected("tapşırıq yaradılmadı", error, t("actions.unexpected"));
  }
  revalidatePath(localizePath(PAGE, locale));
  return success(t("tasks.created"));
}

/** Statusu dəyişir: icraçı icra statuslarını, idarəçi və ya yaradan ləğvi. */
export async function changeTaskStatus(id: string, status: string): Promise<ActionState> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("account");
  let user;
  try {
    user = await requirePublicAction("team", locale);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(t("actions.actionUnavailable"));
    throw error;
  }
  try {
    const access = await getAgencyAccess(user);
    const result = await updateAgencyTaskStatus({ access, actorId: user.id, taskId: String(id).slice(0, 40), status });
    if (result.result !== "updated") return failure(t(`tasks.errors.${result.result}`));
    const { task } = result;
    if (access && task.from !== status) {
      await recordAgencyActivity({
        agencyId: access.agencyId, actor: user, action: AGENCY_ACTIVITY_ACTIONS.TASK_STATUS_CHANGED,
        entityType: "AgencyTask", entityId: task.id, entityLabel: task.title, details: { from: task.from, to: status },
      });
      if (status === AGENCY_TASK_STATUSES.DONE && task.createdById && task.createdById !== user.id) {
        await noticeAgencyTask({ userId: task.createdById, taskId: task.id, stage: "completed", taskTitle: task.title, agencyName: access.agencyName, actorName: user.name });
      }
    }
  } catch (error) {
    return unexpected("tapşırığın statusu dəyişmədi", error, t("actions.unexpected"));
  }
  revalidatePath(localizePath(PAGE, locale));
  return success(t("tasks.statusChanged"));
}
