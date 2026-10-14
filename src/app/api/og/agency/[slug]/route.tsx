import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { prisma } from "@/lib/prisma";
import { demoWhere } from "@/lib/demo-content";
import { countAgencyOffers } from "@/lib/agency-profile";
import { routing } from "@/i18n/routing";
import type { Locale } from "@/lib/constants";
import { ogImageDataUri, ogJpegResponse } from "@/lib/og-image";

/**
 * Agentlik profili üçün paylaşım kartı (Open Graph, 1200×630) — #157.
 *
 * Əvvəl profil linki paylaşılanda yalnız loqo (çox vaxt kvadrat, kiçik) görünürdü.
 * Kart: qızılı şəbəkəli tünd fon, ağ lövhədə loqo, ad, təsdiq nişanı və təklif/agent
 * sayı — sayma qaydası kataloq və profillə eynidir (`countAgencyOffers`). Loqo PNG
 * kimi yerləşir ki, şəffaflığı itməsin; nəticə JPEG-dir (`og-image.ts`).
 */

export const dynamic = "force-dynamic";

const WIDTH = 1200;
const HEIGHT = 630;
const LOGO_BOX = 300;
const UPPERCASE_LOCALE: Record<Locale, string> = { az: "az-AZ", en: "en-US", ru: "ru-RU" };

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const requested = new URL(request.url).searchParams.get("l");
  const locale: Locale = requested && hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  const agency = slug.length <= 200
    ? await prisma.agency.findFirst({
        where: { slug, isVerified: true, ...(await demoWhere()), user: { isActive: true } },
        select: { id: true, userId: true, name: true, logoUrl: true },
      })
    : null;
  if (!agency) return new Response("Tapılmadı", { status: 404 });

  const [t, offers, agentCount, logo] = await Promise.all([
    getTranslations({ locale, namespace: "listings.agencyProfile" }),
    countAgencyOffers([agency]),
    prisma.agentProfile.count({ where: { agencyId: agency.id, isPublic: true } }),
    ogImageDataUri(agency.logoUrl, { width: LOGO_BOX * 2, height: LOGO_BOX * 2, fit: "contain", format: "image/png" }),
  ]);
  const stats = offers.get(agency.id) ?? { total: 0, sale: 0, rent: 0 };
  const initials = agency.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toLocaleUpperCase("az-AZ"))
    .join("");

  const facts = [
    { value: stats.total, label: t("ogOffers") },
    { value: stats.sale, label: t("statSale") },
    { value: stats.rent, label: t("statRent") },
    { value: agentCount, label: t("statAgents") },
  ];

  const response = new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          padding: "64px 72px",
          gap: 64,
          alignItems: "center",
          color: "#f7f3ec",
          backgroundColor: "#17202b",
          backgroundImage:
            "linear-gradient(rgba(196,165,117,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(196,165,117,0.14) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      >
        <div
          style={{
            display: "flex",
            width: LOGO_BOX,
            height: LOGO_BOX,
            flexShrink: 0,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 36,
            overflow: "hidden",
            background: "#ffffff",
            border: "4px solid #c4a575",
            boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
          }}
        >
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element -- ImageResponse yalnız <img> qəbul edir.
            <img src={logo} alt="" width={LOGO_BOX - 8} height={LOGO_BOX - 8} style={{ objectFit: "contain", borderRadius: 32 }} />
          ) : (
            <span style={{ fontSize: 120, color: "#9a7b4f" }}>{initials || "LH"}</span>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
          {/* `textTransform` satori-də dilə həssas deyil («i» → «I»); böyük hərf dilin qaydası ilə. */}
          <div style={{ display: "flex", fontSize: 24, color: "#c4a575", letterSpacing: 3 }}>
            {t("ogEyebrow").toLocaleUpperCase(UPPERCASE_LOCALE[locale])}
          </div>
          <div style={{ display: "block", marginTop: 16, fontSize: agency.name.length > 28 ? 52 : 64, lineHeight: 1.1, lineClamp: 2 }}>
            {agency.name}
          </div>
          <div style={{ display: "flex", marginTop: 20 }}>
            <span
              style={{
                display: "flex",
                padding: "8px 20px",
                borderRadius: 999,
                fontSize: 22,
                color: "#17202b",
                background: "#c4a575",
              }}
            >
              {t("verified")}
            </span>
          </div>
          <div style={{ display: "flex", marginTop: 40, gap: 40 }}>
            {facts.map((fact) => (
              <div key={fact.label} style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 52, color: "#ffffff" }}>{fact.value}</span>
                <span style={{ fontSize: 22, color: "rgba(247,243,236,0.7)" }}>{fact.label}</span>
              </div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 40,
              paddingTop: 20,
              borderTop: "1px solid rgba(196,165,117,0.45)",
              fontSize: 22,
              letterSpacing: 4,
              color: "#c4a575",
            }}
          >
            LUXE HOME ESTATE
          </div>
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT },
  );

  return ogJpegResponse(response);
}
