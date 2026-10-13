import { ACCOUNT_TYPES } from "@/lib/constants";
import { normalizeAzMobile } from "@/lib/auth/phone-otp-policy";

/**
 * Elanı kim yerləşdirib və ziyarətçi kimlə əlaqə saxlamalıdır.
 *
 * Əvvəl detal səhifəsi hər elanda şirkətin nömrəsini göstərirdi — mülk sahibinin
 * və ya agentliyin elanına zəng edən alıcı Luxe Home ofisinə düşürdü. Qayda:
 *
 * - müəllif yoxdursa, əməkdaşdırsa (STAFF) və ya deaktiv edilibsə — şirkət əlaqəsi
 *   (müraciət forması da belə elanı ofisə yönəldir, `resolveLeadProperty`);
 * - agentlik hesabı — agentliyin adı, loqosu və nömrəsi (yoxdursa hesabın nömrəsi);
 * - agentliyin təsdiqlənmiş əməkdaşı — agentin öz adı/nömrəsi + agentliyin adı;
 * - digər ictimai hesablar — hesabın ad soyadı, telefonu və e-poçtu.
 *
 * Agentlik `agencyEmployments[0]`-dan götürülür: «bir aktiv agentlik» invariantı
 * (`hasOtherApprovedMembership`) dəvət və təsdiqdə qorunur, ona görə ən çox bir
 * təsdiqlənmiş üzvlük olur.
 *
 * Modul Prisma idxal etmir: kart (client) və detal (server) eyni qaydanı işlədir.
 */

export type PublisherAgency = {
  name: string;
  slug: string;
  logoUrl: string | null;
  isVerified: boolean;
};

export type PublisherKind = "company" | "agency" | "agent" | "owner" | "corporate" | "private";

/** Kartda göstərilən qısa forma — telefon/e-poçt kart sorğusuna düşmür. */
export type PublisherCardSource = {
  accountType: string;
  /** Deaktiv hesabın elanı ictimai qala bilər — əlaqə o zaman ofisə düşür. */
  isActive: boolean;
  agency: PublisherAgency | null;
  agencyEmployments: { agency: PublisherAgency }[];
} | null | undefined;

/** Detal səhifəsinin tam forması. */
export type PublisherContactSource = {
  accountType: string;
  isActive: boolean;
  name: string;
  phone: string | null;
  email: string;
  companyName: string | null;
  agency: (PublisherAgency & { phone: string | null }) | null;
  agencyEmployments: { agency: PublisherAgency & { phone: string | null } }[];
} | null | undefined;

export type ListingPublisher =
  | { kind: "company" }
  | {
      kind: Exclude<PublisherKind, "company">;
      /** Ziyarətçiyə göstərilən ad: agentlikdə agentliyin, korporativdə şirkətin adı. */
      displayName: string;
      /** Əlaqə şəxsi — hesabın ad soyadı. */
      contactName: string;
      phone: string | null;
      email: string | null;
      agency: PublisherAgency | null;
    };

function publisherKind(accountType: string, hasEmployerAgency: boolean): PublisherKind {
  if (accountType === ACCOUNT_TYPES.STAFF) return "company";
  if (accountType === ACCOUNT_TYPES.AGENCY) return "agency";
  // Agentliyin təsdiqlənmiş əməkdaşı hesab növündən asılı olmayaraq agentlik adından danışır.
  if (accountType === ACCOUNT_TYPES.AGENT || hasEmployerAgency) return "agent";
  if (accountType === ACCOUNT_TYPES.OWNER) return "owner";
  if (accountType === ACCOUNT_TYPES.CORPORATE) return "corporate";
  return "private";
}

/** Kart üçün: yalnız növ və agentlik — əlaqə məlumatı kartda göstərilmir. */
export function listingPublisherBadge(author: PublisherCardSource): { kind: PublisherKind; agency: PublisherAgency | null } {
  if (!author || !author.isActive) return { kind: "company", agency: null };
  const employer = author.agencyEmployments[0]?.agency ?? null;
  const kind = publisherKind(author.accountType, employer != null);
  if (kind === "company") return { kind, agency: null };
  return { kind, agency: author.agency ?? employer };
}

export function resolveListingPublisher(author: PublisherContactSource): ListingPublisher {
  if (!author || !author.isActive) return { kind: "company" };
  const employer = author.agencyEmployments[0]?.agency ?? null;
  const kind = publisherKind(author.accountType, employer != null);
  if (kind === "company") return { kind };

  const ownAgency = kind === "agency" ? author.agency : null;
  const agency = ownAgency ?? employer;
  const displayName =
    (kind === "agency" && ownAgency?.name) ||
    (kind === "corporate" && author.companyName) ||
    author.name;

  return {
    kind,
    displayName,
    contactName: author.name,
    // Agentlik profilindəki nömrə ofis nömrəsidir — hesabın şəxsi nömrəsindən üstündür.
    phone: (ownAgency?.phone || author.phone || null)?.trim() || null,
    email: author.email || null,
    agency: agency
      ? { name: agency.name, slug: agency.slug, logoUrl: agency.logoUrl, isVerified: agency.isVerified }
      : null,
  };
}

/** `tel:` linki — rəqəm və öndəki «+» saxlanılır. */
export function phoneHref(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, "");
  return `tel:${cleaned}`;
}

/** WhatsApp yalnız mobil nömrədə mənalıdır; şəhər nömrəsi üçün null. */
export function publisherWhatsappHref(phone: string | null, message?: string): string | null {
  const mobile = normalizeAzMobile(phone);
  if (!mobile) return null;
  const base = `https://wa.me/${mobile.slice(1)}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/**
 * Səhifədə göstərilən maskalı nömrə: «+994 50 123 •• ••». Tam nömrə HTML-ə düşmür,
 * «Nömrəni göstər» kliki ilə limitli API-dən gəlir — bot-lar nömrə toplaya bilməsin.
 */
export function maskPhone(phone: string): string {
  const mobile = normalizeAzMobile(phone);
  if (mobile) return `+994 ${mobile.slice(4, 6)} ${mobile.slice(6, 9)} •• ••`;
  const visible = phone.trim().slice(0, Math.max(0, phone.trim().length - 4));
  return `${visible}••••`;
}
