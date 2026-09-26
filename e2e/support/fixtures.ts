import { ACCOUNT_TYPES, AUTH_KINDS, ROLES } from "../../src/lib/constants";

/**
 * Lokal stack E2E test hesablarının sabit identifikatorları (#87).
 *
 * `scripts/e2e/local-stack-fixtures.ts` bu dəyərlərlə D1-ə yazır, Playwright
 * testləri isə eyni dəyərlərlə cookie imzalayır. Rol, hesab növü və doğrulama
 * növü `constants.ts`-dən gəlir — dəyər dəyişsə, sətirlər və cookie iddiaları
 * birlikdə dəyişir. Sirrlər (AUTH_SECRET, TOTP) burada deyil — CI hər run üçün
 * təsadüfi yaradır və mühit dəyişəni kimi ötürür.
 */
export const E2E_FIXTURES = {
  admin: {
    id: "e2e-admin",
    email: "e2e-admin@luxehomeestate.test",
    locale: "en",
    role: ROLES.SUPER_ADMIN,
    accountType: ACCOUNT_TYPES.STAFF,
  },
  lister: {
    id: "e2e-lister",
    email: "e2e-lister@luxehomeestate.test",
    sessionId: "e2e-lister-session",
    // İctimai hesab panel səlahiyyəti almır; `role` yalnız sxem tələbidir
    // (`hesab/actions.ts`-dəki qeydiyyat axını ilə eyni).
    role: ROLES.EDITOR,
    accountType: ACCOUNT_TYPES.OWNER,
    authKind: AUTH_KINDS.PUBLIC,
  },
} as const;
