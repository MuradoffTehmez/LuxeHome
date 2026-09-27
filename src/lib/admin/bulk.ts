import { failure, success, type ActionState } from "@/lib/admin/action-state";
import * as form from "@/lib/admin/form";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import type { Permission } from "@/lib/constants";
import { msg } from "@/lib/admin/server-message";

/**
 * Toplu əməliyyatların ümumi qaydaları.
 *
 * D1 tranzaksiya dəstəkləmir, ona görə hər qeyd ayrıca işlənir və nəticə mesajı
 * neçəsinin alındığını bildirir. Bir sorğuda ən çox `BULK_LIMIT` qeyd — Worker-in
 * subrequest həddinə sığmaq üçün.
 */
const BULK_LIMIT = 100;

/** Formadan seçilmiş id-ləri oxuyur (`BulkSelectionForm` → `name="ids"`). */
export function readBulkSelection(
  formData: FormData,
  intents: readonly string[],
): { ids: string[]; intent: string } | ActionState {
  const ids = form.uniqueList(formData, "ids");
  if (ids.length === 0) return failure(msg("server.bulk.hecNeSecilmeyib"));
  if (ids.length > BULK_LIMIT) return failure(msg("server.bulk.limitAsildi", { p0: String(BULK_LIMIT) }));

  const intent = form.text(formData, "intent");
  if (!intents.includes(intent)) return failure(msg("server.bulk.namelumEmeliyyat"));
  return { ids, intent };
}

export function isBulkFailure(value: { ids: string[]; intent: string } | ActionState): value is ActionState {
  return "status" in value;
}

/**
 * Hər id üçün mövcud tək-qeyd action-unu çağırır (guard, audit və keş
 * invalidasiyası onun içindədir) və nəticəni bir mesajda toplayır.
 */
export async function runBulk(ids: readonly string[], run: (id: string) => Promise<ActionState>): Promise<ActionState> {
  let done = 0;
  for (const id of ids) {
    try {
      const result = await run(id);
      if (result.status === "success") done += 1;
    } catch (error) {
      console.error(`[bulk] «${id}» işlənmədi:`, error);
    }
  }
  return bulkResult(done, ids.length);
}

function bulkResult(done: number, total: number): ActionState {
  if (done === 0) return failure(msg("server.bulk.hecBiriAlinmadi"));
  if (done < total) return success(msg("server.bulk.qismenTamamlandi", { p0: String(done), p1: String(total) }));
  return success(msg("server.bulk.tamamlandi", { p0: String(done) }));
}

/**
 * Ən sadə hal: hər intent mövcud tək-qeyd action-una bağlanır (`delete` → `deleteLead`).
 * Guard toplu action-un ilk addımıdır — tək action-lar onu yenidən yoxlasa da, birbaşa
 * POST ilə çağırılan toplu action öz qorumasını daşımalıdır.
 */
export async function guardedBulk(
  permission: Permission,
  formData: FormData,
  handlers: Record<string, (id: string) => Promise<ActionState>>,
): Promise<ActionState> {
  try {
    await requireAdminAction(permission);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const selection = readBulkSelection(formData, Object.keys(handlers));
  if (isBulkFailure(selection)) return selection;
  return runBulk(selection.ids, handlers[selection.intent]);
}
