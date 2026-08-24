import type { ZodError } from "zod";

/**
 * Bütün admin server action-larının ümumi cavab tipi.
 *
 * `useActionState` ilə işləyən formalar eyni formanı gözləyir: `status` düymənin
 * vəziyyətini, `message` toast mətnini, `fieldErrors` isə sahə altındakı xəta sətrini verir.
 */
export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  /**
   * Bir dəfə göstərilən dəyər — müvəqqəti parol kimi.
   *
   * Toast 4 saniyəyə itir və uzun parolu oradan köçürmək mümkün deyil, ona görə
   * belə nəticə ayrıca sahədə gəlir: UI onu qalıcı panelə çıxarır və köçürmə
   * düyməsi verir.
   */
  secret?: string;
};

export const IDLE_STATE: ActionState = { status: "idle" };

/** Zod xətalarını sahə adı → ilk mesaj xəritəsinə çevirir. */
export function toFieldErrors(error: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export function failure(message: string, fieldErrors?: Record<string, string>): ActionState {
  return { status: "error", message, fieldErrors };
}

export function invalid(error: ZodError): ActionState {
  return {
    status: "error",
    message: "Formada xətalar var. Qeyd olunan sahələri yoxlayın.",
    fieldErrors: toFieldErrors(error),
  };
}

export function success(message: string): ActionState {
  return { status: "success", message };
}

/** Nəticə ilə birlikdə bir dəfəlik dəyər qaytarır (müvəqqəti parol və s.). */
export function successWithSecret(message: string, secret: string): ActionState {
  return { status: "success", message, secret };
}

/**
 * Gözlənilməz baza xətalarını istifadəçiyə göstərilən mesaja çevirir.
 *
 * Xətanın özü konsola yazılır — Workers loglarında görünür. İstifadəçiyə
 * daxili detal qaytarılmır.
 */
export function unexpected(
  context: string,
  error: unknown,
  publicMessage = "Əməliyyat tamamlanmadı. Bir az sonra yenidən cəhd edin.",
): ActionState {
  console.error(`[admin] ${context}:`, error);
  return failure(publicMessage);
}
