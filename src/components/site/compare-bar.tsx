"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GitCompareArrows } from "lucide-react";
import { ConfirmClearButton } from "@/components/site/confirm-clear-button";
import { useCompareList } from "@/lib/compare";
import { cn } from "@/lib/utils";

export function getCompareBarPositionClass(pathname: string): string {
  return /^\/emlaklar\/[^/]+\/?$/.test(pathname)
    ? "bottom-[calc(5rem+var(--safe-bottom))] lg:bottom-0"
    : "bottom-0";
}

/**
 * Ekranın altında sabit zolaq — istifadəçi müqayisəyə əmlak əlavə etdikcə görünür.
 * `/muqayise` səhifəsinə keçidin yeganə giriş nöqtəsidir, ona görə naviqasiyaya
 * ayrıca link əlavə edilməyib.
 */
export function CompareBar() {
  const { ids, ready, count, clear } = useCompareList();
  const pathname = usePathname();

  if (!ready || count === 0 || pathname === "/muqayise") return null;

  return (
    <aside
      aria-label="Müqayisə siyahısı"
      className={cn(
        "fixed inset-x-0 z-[var(--z-sticky)] border-t border-line-strong bg-ivory/95 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-sm",
        getCompareBarPositionClass(pathname),
      )}
    >
      <div className="mx-auto flex min-h-14 w-full max-w-360 flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6 lg:px-10">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-ink">
          <GitCompareArrows className="size-4 text-gold-deep" aria-hidden="true" />
          {count} əmlak müqayisəyə seçildi
        </span>

        <div className="flex items-center gap-2">
          <ConfirmClearButton
            label="Təmizlə"
            title="Müqayisə siyahısı təmizlənsin?"
            description="Seçdiyiniz bütün əmlaklar müqayisə siyahısından çıxarılacaq."
            onConfirm={clear}
          />
          <Link
            href="/muqayise"
            className="inline-flex min-h-11 items-center rounded-xs bg-ink px-4 text-xs font-medium text-ink-invert transition-colors hover:bg-charcoal"
          >
            Müqayisə et ({ids.length})
          </Link>
        </div>
      </div>
    </aside>
  );
}
