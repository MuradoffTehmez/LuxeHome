/**
 * Lokal stack E2E test hesablarının sabit identifikatorları (#87).
 *
 * `scripts/e2e/local-stack-fixtures.ts` bu dəyərlərlə D1-ə yazır, Playwright
 * testləri isə eyni dəyərlərlə cookie imzalayır. Sirrlər (AUTH_SECRET, TOTP) burada
 * deyil — CI hər run üçün təsadüfi yaradır və mühit dəyişəni kimi ötürür.
 */
export const E2E_FIXTURES = {
  admin: { id: "e2e-admin", email: "e2e-admin@luxehomeestate.test", locale: "en" },
  lister: { id: "e2e-lister", email: "e2e-lister@luxehomeestate.test", sessionId: "e2e-lister-session" },
} as const;
