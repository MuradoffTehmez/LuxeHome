import type { AccountType } from "@/lib/constants";

export type CabinetSummaryStore = {
  countProperties(userId: string): Promise<number>;
  findAgency(userId: string): Promise<{ name: string; isVerified: boolean } | null>;
};

/** Kabinetdə göstərilən hesaba aid qısa məlumatı paralel oxuyur. */
export async function getCabinetSummary(
  store: CabinetSummaryStore,
  user: { id: string; accountType: AccountType },
) {
  const [propertyCount, agency] = await Promise.all([
    store.countProperties(user.id),
    store.findAgency(user.id),
  ]);

  return { propertyCount, agency };
}
