import type { SessionClaims } from "./cookies";
import type { AccountType, AuthKind } from "@/lib/constants";

type SessionProjection = {
  id: string;
  role: string;
  accountType: AccountType;
  sessionAuthKind: AuthKind;
};

/** İmzalı cookie və D1 sessiyasının eyni autentifikasiya qərarını daşıdığını yoxlayır. */
export function matchesSessionProjection(
  claims: SessionClaims,
  session: SessionProjection,
): boolean {
  return (
    claims.uid === session.id &&
    claims.role === session.role &&
    claims.accountType === session.accountType &&
    claims.authKind === session.sessionAuthKind
  );
}
