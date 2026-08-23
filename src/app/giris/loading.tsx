import { AuthShell } from "@/components/auth/auth-shell";
import { Skeleton } from "@/components/ui/states";

export default function StaffAuthLoading() {
  return (
    <AuthShell standalone eyebrow="İdarə paneli" title="Giriş hazırlanır">
      <div role="status" aria-label="Giriş forması yüklənir" aria-busy="true" className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <span className="sr-only">Giriş forması yüklənir…</span>
      </div>
    </AuthShell>
  );
}
