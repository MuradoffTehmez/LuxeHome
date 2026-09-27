import { ACCOUNT_TYPES, type AccountType } from "@/lib/constants";

export type PublicAccountInput = {
  name: string;
  email: string;
  phone: string | null;
  passwordHash: string;
  accountType: AccountType;
  agencyName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  birthDate?: Date | null;
  companyName?: string | null;
  companyTaxId?: string | null;
  companyWebsite?: string | null;
};

type PublicUserInput = Omit<PublicAccountInput, "agencyName">;

export type PublicAccountStore = {
  createUser(input: PublicUserInput): Promise<{ id: string }>;
  createAgency(input: { userId: string; name: string; phone: string | null }): Promise<void>;
  /** Agent hesabı üçün ictimai olmayan (admin təsdiqi gözləyən) agent profili. */
  createAgentProfile?(input: { userId: string; name: string; phone: string | null; email: string }): Promise<void>;
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
    if (input.accountType === ACCOUNT_TYPES.AGENT && store.createAgentProfile) {
      await store.createAgentProfile({
        userId: user.id,
        name: input.name,
        phone: input.phone,
        email: input.email,
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
