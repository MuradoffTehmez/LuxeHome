"use client";

import { Checkbox, Input, Select, Textarea } from "@/components/ui/field";
import { useFieldError } from "./form-shell";

/**
 * `ui/field.tsx` üzərində nazik qat: xəta mətnini kontekstdən özü götürür.
 *
 * Bu olmasaydı, hər sahədə `error={state.fieldErrors?.title}` təkrarlanacaqdı və
 * yeni sahə əlavə edəndə xəta bağlantısını unutmaq asan olardı.
 */

type WithName = { name: string };

export function AdminInput(props: React.ComponentProps<typeof Input> & WithName) {
  return <Input {...props} error={useFieldError(props.name)} />;
}

export function AdminTextarea(props: React.ComponentProps<typeof Textarea> & WithName) {
  return <Textarea {...props} error={useFieldError(props.name)} />;
}

export function AdminSelect(props: React.ComponentProps<typeof Select> & WithName) {
  return <Select {...props} error={useFieldError(props.name)} />;
}

export { Checkbox as AdminCheckbox };

/** Formanın bir sətrini tam enində saxlayan sarğı (grid `sm:grid-cols-2` içində). */
export function FullWidth({ children }: { children: React.ReactNode }) {
  return <div className="sm:col-span-2">{children}</div>;
}
