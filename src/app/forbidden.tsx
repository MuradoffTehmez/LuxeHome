import Link from "next/link";
import { ShieldAlert } from "lucide-react";

/**
 * `forbidden()` naviqasiya kəsicisinin göstərdiyi 403 səhifəsi.
 * `next.config.ts`-dəki `experimental.authInterrupts` bayrağı olmadan işləmir.
 */
export default function Forbidden() {
  return (
    <main className="grid min-h-dvh place-items-center bg-ivory px-5">
      <div className="max-w-md text-center">
        <ShieldAlert className="mx-auto mb-4 size-10 text-ink-muted" aria-hidden="true" />
        <h1 className="font-display text-3xl text-ink">İcazəniz yoxdur</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          Bu bölmə sizin rolunuz üçün açıq deyil. Səhv olduğunu düşünürsünüzsə,
          panel administratoru ilə əlaqə saxlayın.
        </p>
        <Link
          href="/admin"
          className="mt-6 inline-flex min-h-11 items-center rounded-xs bg-gold px-5 text-sm text-ink transition-colors duration-200 hover:bg-gold-soft"
        >
          Panelə qayıt
        </Link>
      </div>
    </main>
  );
}
