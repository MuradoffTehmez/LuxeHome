"use client";

import Link from "next/link";
import { GitCompareArrows, X } from "lucide-react";
import { useCompareList } from "@/lib/compare";

/**
 * Ekranın altında sabit zolaq — istifadəçi müqayisəyə əmlak əlavə etdikcə görünür.
 * `/muqayise` səhifəsinə keçidin yeganə giriş nöqtəsidir, ona görə naviqasiyaya
 * ayrıca link əlavə edilməyib.
 */
export function CompareBar() {
  const { ids, ready, count, clear } = useCompareList();

  if (!ready || count === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line-strong bg-ivory/95 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-360 flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-6 lg:px-10">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-ink">
          <GitCompareArrows className="size-4 text-gold-deep" aria-hidden="true" />
          {count} əmlak müqayisəyə seçildi
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={clear}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xs px-3 text-xs font-medium text-ink-muted transition-colors hover:text-ink"
          >
            <X className="size-3.5" aria-hidden="true" />
            Təmizlə
          </button>
          <Link
            href="/muqayise"
            className="inline-flex min-h-9 items-center rounded-xs bg-ink px-4 text-xs font-medium text-ink-invert transition-colors hover:bg-charcoal"
          >
            Müqayisə et ({ids.length})
          </Link>
        </div>
      </div>
    </div>
  );
}
