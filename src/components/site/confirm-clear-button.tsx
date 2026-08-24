"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Overlay } from "@/components/ui/overlay";

export type ConfirmClearButtonProps = {
  label?: string;
  title: string;
  description: string;
  onConfirm: () => void;
};

/** Lokal favorit/müqayisə siyahısını tək səhv kliklə silməyə qoymur. */
export function ConfirmClearButton({
  label,
  title,
  description,
  onConfirm,
}: ConfirmClearButtonProps) {
  const t = useTranslations("property.clear");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        {label ?? t("label")}
      </Button>
      <Overlay
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        description={description}
        footer={
          <>
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => {
                onConfirm();
                setOpen(false);
              }}
            >
              {t("deleteAll")}
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink-soft">
          {t("notice")}
        </p>
      </Overlay>
    </>
  );
}
