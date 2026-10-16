"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { PauseCircle, PlayCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import {
  AGENCY_EMPLOYEE_ROLES,
  AGENCY_MEMBER_PERMISSIONS,
  AGENCY_ROLE_DEFAULT_PERMISSIONS,
  SUSPENSION_REASON_MAX,
  type AgencyEmployeeRole,
  type AgencyMemberPermission,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { resumeMember, suspendMember, updateMemberAccess } from "./member-actions";

const PERMISSIONS = Object.values(AGENCY_MEMBER_PERMISSIONS) as AgencyMemberPermission[];
const ROLES = [AGENCY_EMPLOYEE_ROLES.AGENT, AGENCY_EMPLOYEE_ROLES.MANAGER] as const;
const PERMISSION_KEYS = { LEADS_MANAGE: "leads", LISTINGS_ASSIGN: "listings", TASKS_MANAGE: "tasks" } as const;

/**
 * Rol və səlahiyyətlər (#218, PRD 7.2). Rol dəyişəndə işarələr rolun defoltuna qayıdır; sahib sonra
 * hər birini ayrıca dəyişə bilər. Defoltla eyni seçim serverdə `null` saxlanılır.
 */
export function MemberAccessButton({
  id,
  name,
  role,
  permissions,
}: {
  id: string;
  name: string;
  role: AgencyEmployeeRole;
  permissions: AgencyMemberPermission[];
}) {
  const t = useTranslations("account.team.access");
  const [open, setOpen] = useState(false);
  const [nextRole, setNextRole] = useState<AgencyEmployeeRole>(role);
  const [selected, setSelected] = useState<AgencyMemberPermission[]>(permissions);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  function changeRole(value: AgencyEmployeeRole) {
    setNextRole(value);
    setSelected([...AGENCY_ROLE_DEFAULT_PERMISSIONS[value]]);
  }

  function toggle(permission: AgencyMemberPermission) {
    setSelected((current) => (current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission]));
  }

  function submit() {
    startTransition(async () => {
      const result = await updateMemberAccess(id, nextRole, selected);
      if (result.status !== "success") {
        setError(result.message ?? t("failed"));
        return;
      }
      if (result.message) toast(result.message, "success");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setNextRole(role);
          setSelected(permissions);
          setError(null);
          setOpen(true);
        }}
        aria-label={t("openLabel", { name })}
        title={t("openLabel", { name })}
        className="grid size-11 cursor-pointer place-items-center rounded-xs text-ink-soft transition-colors hover:bg-ivory hover:text-gold-deep"
      >
        <ShieldCheck className="size-4" aria-hidden="true" />
      </button>
      <Modal
        open={open}
        onClose={() => (pending ? undefined : setOpen(false))}
        title={t("title", { name })}
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={pending}>{t("cancel")}</Button>
            <Button size="sm" onClick={submit} loading={pending}>{t("save")}</Button>
          </>
        }
      >
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium text-ink">{t("roleLegend")}</legend>
          {ROLES.map((value) => (
            <label
              key={value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-sm border p-3 transition-colors",
                nextRole === value ? "border-gold bg-gold/10" : "border-line hover:border-gold",
              )}
            >
              <input type="radio" name={`role-${id}`} checked={nextRole === value} onChange={() => changeRole(value)} className="mt-0.5 size-4 accent-gold" />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-ink">{t(`roles.${value}`)}</span>
                <span className="block text-xs text-ink-muted">{t(`roles.${value}Hint`)}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <fieldset className="mt-5 flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium text-ink">{t("permissionsLegend")}</legend>
          {PERMISSIONS.map((permission) => (
            <label key={permission} className="flex cursor-pointer items-start gap-3 rounded-sm border border-line p-3 hover:border-gold">
              <input type="checkbox" checked={selected.includes(permission)} onChange={() => toggle(permission)} className="mt-0.5 size-4 accent-gold" />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-ink">{t(`permissions.${PERMISSION_KEYS[permission]}`)}</span>
                <span className="block text-xs text-ink-muted">{t(`permissions.${PERMISSION_KEYS[permission]}Hint`)}</span>
              </span>
            </label>
          ))}
        </fieldset>
        {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
      </Modal>
    </>
  );
}

/** Girişin dayandırılması (səbəb istəyə bağlı) və bərpası. */
export function MemberSuspendButton({ id, name, suspended }: { id: string; name: string; suspended: boolean }) {
  const t = useTranslations("account.team.access");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  function submit() {
    startTransition(async () => {
      const result = suspended ? await resumeMember(id) : await suspendMember(id, reason);
      if (result.status !== "success") {
        setError(result.message ?? t("failed"));
        return;
      }
      if (result.message) toast(result.message, "success");
      setOpen(false);
      setReason("");
      router.refresh();
    });
  }

  const label = suspended ? t("resumeLabel", { name }) : t("suspendLabel", { name });
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        aria-label={label}
        title={label}
        className={cn(
          "grid size-11 cursor-pointer place-items-center rounded-xs transition-colors",
          suspended ? "text-success hover:bg-success-bg" : "text-warning hover:bg-warning-bg",
        )}
      >
        {suspended ? <PlayCircle className="size-4" aria-hidden="true" /> : <PauseCircle className="size-4" aria-hidden="true" />}
      </button>
      <Modal
        open={open}
        onClose={() => (pending ? undefined : setOpen(false))}
        title={suspended ? t("resumeTitle") : t("suspendTitle")}
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={pending}>{t("cancel")}</Button>
            <Button variant={suspended ? "primary" : "danger"} size="sm" onClick={submit} loading={pending}>
              {suspended ? t("resume") : t("suspend")}
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">{suspended ? t("resumeDescription", { name }) : t("suspendDescription", { name })}</p>
        {!suspended && (
          <div className="mt-4">
            <Textarea label={t("reason")} value={reason} onChange={(event) => setReason(event.target.value)} maxLength={SUSPENSION_REASON_MAX} rows={3} />
          </div>
        )}
        {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
      </Modal>
    </>
  );
}
