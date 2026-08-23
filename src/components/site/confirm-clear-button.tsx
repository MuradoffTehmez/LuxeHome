"use client";

import { useState } from "react";
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
  label = "Siyahını təmizlə",
  title,
  description,
  onConfirm,
}: ConfirmClearButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Overlay
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        description={description}
        footer={
          <>
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Ləğv et
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
              Hamısını sil
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink-soft">
          Bu əməliyyat yalnız bu cihazda saxlanan siyahıya təsir edir.
        </p>
      </Overlay>
    </>
  );
}
