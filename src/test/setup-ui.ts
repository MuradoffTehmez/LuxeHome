import React from "react";
import { vi } from "vitest";

import common from "@/i18n/locales/az/common.json";
import navigation from "@/i18n/locales/az/navigation.json";
import auth from "@/i18n/locales/az/auth.json";
import account from "@/i18n/locales/az/account.json";
import property from "@/i18n/locales/az/property.json";
import validation from "@/i18n/locales/az/validation.json";
import home from "@/i18n/locales/az/home.json";
import listings from "@/i18n/locales/az/listings.json";
import content from "@/i18n/locales/az/content.json";
import contact from "@/i18n/locales/az/contact.json";
import legal from "@/i18n/locales/az/legal.json";
import partners from "@/i18n/locales/az/partners.json";
import seoLandings from "@/i18n/locales/az/seoLandings.json";
import phase2 from "@/i18n/locales/az/phase2.json";

const messages = { common, navigation, auth, account, property, validation, home, listings, content, contact, legal, partners, seoLandings, phase2 };

vi.mock("next-intl", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next-intl")>();
  const formatter = actual.createFormatter({ locale: "az-AZ", timeZone: "Asia/Baku" });

  return {
    ...actual,
    useTranslations: (namespace?: string) =>
      actual.createTranslator({ locale: "az", messages, namespace: namespace as never }),
    useFormatter: () => formatter,
    useLocale: () => "az",
  };
});

vi.mock("next-intl/server", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    getTranslations: async (input?: string | { locale?: string; namespace?: string }) => {
      const namespace = typeof input === "string" ? input : input?.namespace;
      return actual.createTranslator({
        locale: typeof input === "object" && input.locale ? input.locale : "az",
        messages,
        namespace: namespace as never,
      });
    },
    getLocale: async () => "az",
    getMessages: async () => messages,
  };
});

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: { href: string; children?: React.ReactNode }) =>
    React.createElement("a", { ...props, href }, children),
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  redirect: vi.fn(),
  getPathname: vi.fn(),
}));
