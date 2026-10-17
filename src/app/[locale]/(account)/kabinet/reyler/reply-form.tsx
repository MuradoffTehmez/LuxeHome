"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { REVIEW_REPLY_MAX } from "@/lib/constants";
import { replyToReview } from "./actions";

/** Təsdiqlənmiş rəyə ictimai cavab (#230, PRD 10.5); mövcud cavab redaktə və ya silinə bilər. */
export function ReviewReplyForm({ kind, id, reply }: { kind: "agent" | "agency"; id: string; reply: string | null }) {
  const t = useTranslations("account.reviews");
  const { toast } = useToast();
  const router = useRouter();
  const [text, setText] = useState(reply ?? "");
  const [pending, startTransition] = useTransition();
  const save = (value: string) =>
    startTransition(async () => {
      const result = await replyToReview(kind, id, value);
      toast(result.message ?? t("failed"), result.status === "success" ? "success" : "error");
      if (result.status === "success") {
        if (!value) setText("");
        router.refresh();
      }
    });
  return (
    <div className="flex flex-col gap-2">
      <Textarea label={t("replyLabel")} hint={t("replyHint")} value={text} onChange={(event) => setText(event.target.value)} maxLength={REVIEW_REPLY_MAX} rows={3} />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" loading={pending} disabled={text.trim().length < 2 || text.trim() === (reply ?? "")} onClick={() => save(text)}>
          {reply ? t("update") : t("publish")}
        </Button>
        {reply && (
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => save("")}>{t("remove")}</Button>
        )}
      </div>
    </div>
  );
}
