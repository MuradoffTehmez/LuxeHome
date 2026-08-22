import { requireAccount } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

/** Kabinetin D1 əsaslı qoruma həlqəsi; middleware yalnız cookie imzasını yoxlayır. */
export default async function CabinetLayout({ children }: { children: React.ReactNode }) {
  await requireAccount();
  return children;
}
