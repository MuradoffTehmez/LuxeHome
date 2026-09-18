import { SignJWT, importPKCS8 } from "jose";
import { runtimeEnv } from "@/lib/runtime-env";

const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const SEARCH_CONSOLE_SCOPE = "https://www.googleapis.com/auth/webmasters";

export const DEFAULT_GSC_SITE_URL = "sc-domain:luxehomeestate.az";

export type SearchConsoleCredentialMode =
  | "service-account"
  | "oauth-refresh"
  | "access-token"
  | "invalid"
  | "missing";

export type SearchConsoleCredentialStatus = {
  configured: boolean;
  mode: SearchConsoleCredentialMode;
  missing: string[];
};

type ServiceAccountCredential = {
  client_email?: unknown;
  private_key?: unknown;
};

type GoogleTokenResponse = {
  access_token?: unknown;
  error?: unknown;
  error_description?: unknown;
};

export class SearchConsoleConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SearchConsoleConfigurationError";
  }
}

function serviceAccountCredential(): {
  email: string;
  privateKey: string;
} | null {
  const raw = runtimeEnv("GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT_JSON");
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as ServiceAccountCredential;
    const email = typeof parsed.client_email === "string" ? parsed.client_email.trim() : "";
    const privateKey = typeof parsed.private_key === "string" ? parsed.private_key.trim() : "";
    if (!email || !privateKey) return null;
    return { email, privateKey: privateKey.replace(/\\n/g, "\n") };
  } catch {
    return null;
  }
}

function oauthRefreshCredential(): {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
} | null {
  const clientId = runtimeEnv("GOOGLE_SEARCH_CONSOLE_CLIENT_ID");
  const clientSecret = runtimeEnv("GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET");
  const refreshToken = runtimeEnv("GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN");
  if (!clientId || !clientSecret || !refreshToken) return null;
  return { clientId, clientSecret, refreshToken };
}

export function getSearchConsoleCredentialStatus(): SearchConsoleCredentialStatus {
  const serviceAccountJson = runtimeEnv("GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT_JSON");
  if (serviceAccountJson) {
    return serviceAccountCredential()
      ? { configured: true, mode: "service-account", missing: [] }
      : {
          configured: false,
          mode: "invalid",
          missing: ["GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT_JSON (etibarsız JSON/key)"],
        };
  }

  const oauthKeys = [
    "GOOGLE_SEARCH_CONSOLE_CLIENT_ID",
    "GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET",
    "GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN",
  ] as const;
  const presentOauthKeys = oauthKeys.filter((key) => runtimeEnv(key));
  if (presentOauthKeys.length > 0) {
    const missing = oauthKeys.filter((key) => !runtimeEnv(key));
    return missing.length === 0
      ? { configured: true, mode: "oauth-refresh", missing: [] }
      : { configured: false, mode: "invalid", missing: [...missing] };
  }

  if (runtimeEnv("GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN")) {
    return { configured: true, mode: "access-token", missing: [] };
  }

  return {
    configured: false,
    mode: "missing",
    missing: ["GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT_JSON"],
  };
}

export function getSearchConsoleSiteUrl(): string {
  return runtimeEnv("GSC_SITE_URL") || DEFAULT_GSC_SITE_URL;
}

async function readTokenResponse(response: Response): Promise<string> {
  let payload: GoogleTokenResponse = {};
  try {
    payload = (await response.json()) as GoogleTokenResponse;
  } catch {
    // Google bəzən proxy xətalarında JSON olmayan cavab qaytara bilər.
  }

  if (response.ok && typeof payload.access_token === "string" && payload.access_token) {
    return payload.access_token;
  }

  const description =
    typeof payload.error_description === "string"
      ? payload.error_description.slice(0, 240)
      : typeof payload.error === "string"
        ? payload.error.slice(0, 120)
        : "Google token cavabı etibarsızdır.";
  throw new SearchConsoleConfigurationError(
    `Google OAuth token-i alınmadı (HTTP ${response.status}): ${description}`,
  );
}

async function serviceAccountAccessToken(credential: {
  email: string;
  privateKey: string;
}): Promise<string> {
  let key: CryptoKey;
  try {
    key = await importPKCS8(credential.privateKey, "RS256");
  } catch {
    throw new SearchConsoleConfigurationError(
      "GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT_JSON daxilindəki private_key etibarsızdır.",
    );
  }

  const assertion = await new SignJWT({ scope: SEARCH_CONSOLE_SCOPE })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(credential.email)
    .setAudience(GOOGLE_TOKEN_ENDPOINT)
    .setIssuedAt()
    .setExpirationTime("55m")
    .sign(key);

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  return readTokenResponse(response);
}

async function refreshedOAuthAccessToken(credential: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<string> {
  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: credential.clientId,
      client_secret: credential.clientSecret,
      refresh_token: credential.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  return readTokenResponse(response);
}

/**
 * Search Console üçün hər əməliyyatda işlək access token qaytarır.
 *
 * Service account və OAuth refresh token uzunömürlü credential-dır; qısaömürlü
 * `GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN` yalnız geriyə uyğunluq/fövqəladə test üçündür.
 */
export async function getSearchConsoleAccessToken(): Promise<string> {
  const serviceAccount = serviceAccountCredential();
  if (serviceAccount) return serviceAccountAccessToken(serviceAccount);

  const refreshCredential = oauthRefreshCredential();
  if (refreshCredential) return refreshedOAuthAccessToken(refreshCredential);

  const legacyAccessToken = runtimeEnv("GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN");
  if (legacyAccessToken) return legacyAccessToken;

  const status = getSearchConsoleCredentialStatus();
  const missing = status.missing.join(", ");
  throw new SearchConsoleConfigurationError(
    `Search Console credential-i tamamlanmayıb: ${missing}. Service account tövsiyə olunur.`,
  );
}
