"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { assignAgencyListing } from "../../komanda/member-actions";

/** Elanın məsulunu dəyişmək (#218, PRD 7.2): siyahıdan üzv seçilir, «Təyin et» ilə yazılır. */
export function AssignListingForm({
  propertyId,
  title,
  currentUserId,
  members,
}: {
  propertyId: string;
  title: string;
  currentUserId: string | null;
  members: { userId: string; name: string }[];
}) {
  const t = useTranslations("account.assignments");
  const [target, setTarget] = useState(currentUserId ?? "");
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  const changed = target !== "" && target !== currentUserId;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor={`assign-${propertyId}`}>{t("selectLabel", { title })}</label>
      <select
        id={`assign-${propertyId}`}
        value={target}
        onChange={(event) => setTarget(event.target.value)}
        className="min-h-11 min-w-44 rounded-sm border border-line bg-paper px-3 text-sm text-ink focus:border-gold focus:outline-none sm:text-sm"
      >
        {!currentUserId && <option value="">{t("noOwner")}</option>}
        {members.map((member) => (
          <option key={member.userId} value={member.userId}>{member.name}</option>
        ))}
      </select>
      <Button
        size="sm"
        variant={changed ? "primary" : "ghost"}
        disabled={!changed}
        loading={pending}
        className={changed ? undefined : "border border-line"}
        onClick={() =>
          startTransition(async () => {
            const result = await assignAgencyListing(propertyId, target);
            toast(result.message ?? t("failed"), result.status === "success" ? "success" : "error");
            if (result.status === "success") router.refresh();
          })
        }
      >
        {t("assign")}
      </Button>
    </div>
  );
}
