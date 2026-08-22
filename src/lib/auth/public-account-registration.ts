import { ACCOUNT_TYPES, type AccountType } from "@/lib/constants";

export type PublicAccountInput = {
  name: string;
  email: string;
  phone: string | null;
  passwordHash: string;
  accountType: AccountType;
  agencyName?: string | null;
};

type PublicUserInput = Omit<PublicAccountInput, "agencyName">;

export type PublicAccountStore = {
  createUser(input: PublicUserInput): Promise<{ id: string }>;
  createAgency(input: { userId: string; name: string; phone: string | null }): Promise<void>;
  deleteUser(userId: string): Promise<void>;
};

/**
 * D1 transaction dəstəkləmədiyi üçün agentlik yaradılması uğursuz olanda yeni
 * istifadəçi sətri kompensasiya olaraq silinir.
 */
export async function createPublicAccount(
  store: PublicAccountStore,
  input: PublicAccountInput,
): Promise<{ id: string }> {
  const { agencyName, ...userInput } = input;
  const user = await store.createUser(userInput);

  try {
    if (input.accountType === ACCOUNT_TYPES.AGENCY) {
      if (!agencyName) throw new Error("Agentlik adı tələb olunur.");
      await store.createAgency({
        userId: user.id,
        name: agencyName,
        phone: input.phone,
      });
    }
    return user;
  } catch (error) {
    try {
      await store.deleteUser(user.id);
    } catch {
      // Əsas yazı xətası istifadəçiyə qaytarılır; cleanup sonradan təkrarlana bilər.
    }
    throw error;
  }
}
