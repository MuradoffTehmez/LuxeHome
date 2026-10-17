import { notFound } from "next/navigation";
import { isFeatureEnabled } from "@/lib/feature-flags";

/** CRM modulu funksiya bayrağı ilə söndürüləndə (#242) bütün `/kabinet/musteriler` ağacı 404 verir. */
export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  if (!(await isFeatureEnabled("CRM"))) notFound();
  return children;
}
