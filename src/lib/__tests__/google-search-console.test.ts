import { exportPKCS8, generateKeyPair } from "jose";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_GSC_SITE_URL,
  getSearchConsoleAccessToken,
  getSearchConsoleCredentialStatus,
  getSearchConsoleSiteUrl,
  SearchConsoleConfigurationError,
} from "@/lib/google-search-console";

const ENV_KEYS = [
  "GSC_SITE_URL",
  "GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT_JSON",
  "GOOGLE_SEARCH_CONSOLE_CLIENT_ID",
  "GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET",
  "GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN",
  "GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN",
] as const;

afterEach(() => {
  for (const key of ENV_KEYS) delete process.env[key];
  vi.restoreAllMocks();
});

describe("Google Search Console credential-i", () => {
  it("credential olmadıqda service account tələbini göstərir", async () => {
    expect(getSearchConsoleCredentialStatus()).toEqual({
      configured: false,
      mode: "missing",
      missing: ["GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT_JSON"],
    });
    await expect(getSearchConsoleAccessToken()).rejects.toBeInstanceOf(
      SearchConsoleConfigurationError,
    );
  });

  it("property verilmədikdə domain property-ni istifadə edir", () => {
    expect(getSearchConsoleSiteUrl()).toBe(DEFAULT_GSC_SITE_URL);
    process.env.GSC_SITE_URL = " sc-domain:example.az ";
    expect(getSearchConsoleSiteUrl()).toBe("sc-domain:example.az");
  });

  it("natamam OAuth dəstini hazır hesab etmir", () => {
    process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID = "client-id";
    expect(getSearchConsoleCredentialStatus()).toEqual({
      configured: false,
      mode: "invalid",
      missing: [
        "GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET",
        "GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN",
      ],
    });
  });

  it("OAuth refresh token ilə yeni access token alır", async () => {
    process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID = "client-id";
    process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET = "client-secret";
    process.env.GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN = "refresh-token";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ access_token: "fresh-token", expires_in: 3600 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(getSearchConsoleAccessToken()).resolves.toBe("fresh-token");
    const [, init] = fetchMock.mock.calls[0];
    const body = init?.body as URLSearchParams;
    expect(body.get("grant_type")).toBe("refresh_token");
    expect(body.get("refresh_token")).toBe("refresh-token");
  });

  it("service account JSON ilə imzalanmış JWT dəyişir", async () => {
    const { privateKey } = await generateKeyPair("RS256", { extractable: true });
    const privateKeyPem = await exportPKCS8(privateKey);
    process.env.GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT_JSON = JSON.stringify({
      client_email: "search-console@example.iam.gserviceaccount.com",
      private_key: privateKeyPem,
    });
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ access_token: "service-token", expires_in: 3600 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    expect(getSearchConsoleCredentialStatus().mode).toBe("service-account");
    await expect(getSearchConsoleAccessToken()).resolves.toBe("service-token");
    const [, init] = fetchMock.mock.calls[0];
    const body = init?.body as URLSearchParams;
    expect(body.get("grant_type")).toBe("urn:ietf:params:oauth:grant-type:jwt-bearer");
    expect(body.get("assertion")?.split(".")).toHaveLength(3);
  });
});
