import { describe, expect, it } from "vitest";
import { ACCOUNT_TYPES } from "@/lib/constants";
import {
  createPublicAccount,
  type PublicAccountStore,
} from "../public-account-registration";

function createStore(options: { failAgency?: boolean } = {}) {
  const users = new Map<string, { id: string; email: string }>();
  const agencies = new Map<string, { userId: string; name: string }>();
  let createdUserInput: unknown;

  const store: PublicAccountStore = {
    async createUser(input) {
      createdUserInput = input;
      const user = { id: "new-user", email: input.email };
      users.set(user.id, user);
      return user;
    },
    async createAgency(input) {
      if (options.failAgency) throw new Error("slug artıq var");
      agencies.set(input.userId, { userId: input.userId, name: input.name });
    },
    async deleteUser(userId) {
      users.delete(userId);
    },
  };

  return {
    store,
    users,
    agencies,
    createdUserInput: () => createdUserInput,
  };
}

describe("ictimai hesabın qeydiyyatı", () => {
  it("agentlik profili yaradıla bilməyəndə yeni istifadəçini geri silir", async () => {
    const { store, users, createdUserInput } = createStore({ failAgency: true });

    await expect(
      createPublicAccount(store, {
        name: "Luxe Agentlik",
        email: "agency@example.az",
        phone: "+994501234567",
        passwordHash: "hash",
        accountType: ACCOUNT_TYPES.AGENCY,
        agencyName: "Luxe Agentlik",
      }),
    ).rejects.toThrow("slug artıq var");

    expect(users.has("new-user")).toBe(false);
    expect(createdUserInput()).not.toHaveProperty("agencyName");
  });

  it("mülk sahibini əlavə profil yaratmadan saxlayır", async () => {
    const { store, users, agencies } = createStore();

    const user = await createPublicAccount(store, {
      name: "Aysel Məmmədova",
      email: "aysel@example.az",
      phone: "+994551234567",
      passwordHash: "hash",
      accountType: ACCOUNT_TYPES.OWNER,
    });

    expect(user.id).toBe("new-user");
    expect(users.has("new-user")).toBe(true);
    expect(agencies.size).toBe(0);
  });
});
