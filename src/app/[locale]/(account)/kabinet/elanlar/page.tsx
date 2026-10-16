import type { Metadata } from "next";
import Image from "next/image";
import { CalendarClock, CircleCheckBig, Crown, MessageSquareWarning, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { AdaptiveDataList } from "@/components/ui/adaptive-data-list";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { requireLister } from "@/lib/auth/guard";
import {
  ACTIVE_OFFER_STATUSES,
  LISTING_TYPES,
  MODERATION_HOLD_STATUSES,
  PROPERTY_STATUSES,
  PROPERTY_STATUS_TONE,
  type Locale,
  type PropertyStatus,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { buildManagedMetadata } from "@/lib/seo";
import { formatPrice, isUnoptimizedImage } from "@/lib/utils";
import { AnalyticsEventBeacon } from "@/components/analytics/analytics-event";
import { localizePath } from "@/i18n/path-locale";
import { formatLocalizedDate } from "@/i18n/date";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { closePublicProperty, deletePublicProperty, renewPublicProperty } from "./actions";
import { expiryState } from "@/lib/listing-expiry-policy";
import { getListingExpiryConfig } from "@/lib/settings";

const STATUS_KEYS: Record<PropertyStatus, "draft" | "pending" | "needsInfo" | "published" | "reserved" | "suspended" | "expired" | "sold" | "rented" | "archived" | "rejected"> = {
  DRAFT: "draft", PENDING: "pending", PUBLISHED: "published", RESERVED: "reserved",
  SOLD: "sold", RENTED: "rented", ARCHIVED: "archived",
  NEEDS_INFO: "needsInfo", SUSPENDED: "suspended", EXPIRED: "expired", REJECTED: "rejected",
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "account.listings" });
  return buildManagedMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/kabinet/elanlar", noIndex: true, locale: locale as Locale });
}

export default async function CabinetPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ yeni?: string; yoxlama?: string }>;
}) {
  const locale = await getLocale() as Locale;
  const user = await requireLister(locale);
  const t = await getTranslations("account.listings");
  const [properties, params, packageCount, expiryConfig] = await Promise.all([
    prisma.property.findMany({
      where: { authorId: user.id, deletedAt: null },
      select: {
        id: true,
        title: true,
        price: true,
        currency: true,
        status: true,
        listingType: true,
        moderationNote: true,
        listingExpiresAt: true,
        expiredAt: true,
        isFeatured: true,
        featuredUntil: true,
        images: { select: { url: true }, where: { isCover: true }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    }),
    searchParams,
    prisma.listingPackage.count({ where: { isActive: true } }),
    getListingExpiryConfig(),
  ]);

  type CabinetProperty = (typeof properties)[number];

  function propertyStatus(property: CabinetProperty) {
    return property.status as PropertyStatus;
  }

  const now = Date.now();

  /** Müddət göstəricisi və «Yenilə» düyməsi (#109) — müddəti olmayan elanda heç nə. */
  function ExpiryControls({ property }: { property: CabinetProperty }) {
    const expiry = expiryState(property, now, expiryConfig.reminderDays);
    if (!expiry) return null;
    return (
      <span className="inline-flex flex-wrap items-center gap-2">
        <Badge tone={expiry.state === "active" ? "neutral" : "warning"}>
          <CalendarClock className="size-3.5" aria-hidden="true" />
          {expiry.state === "expired" ? t("expired") : t("expiresIn", { days: expiry.daysLeft })}
        </Badge>
        {expiry.state !== "active" ? (
          <ConfirmAction
            action={renewPublicProperty}
            id={property.id}
            title={t("renewTitle")}
            description={t("renewDescription", { days: expiryConfig.lifetimeDays })}
            confirmLabel={t("renew")}
            label={t("renewLabel", { title: property.title })}
            tone="neutral"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
          </ConfirmAction>
        ) : null}
      </span>
    );
  }

  /** «Satıldı / Kirayəyə verildi» (#202, PRD 5.3) — yalnız aktiv təklifdə. */
  function CloseControl({ property }: { property: CabinetProperty }) {
    if (!(ACTIVE_OFFER_STATUSES as string[]).includes(property.status)) return null;
    const rent = property.listingType === LISTING_TYPES.RENT;
    return (
      <ConfirmAction
        action={closePublicProperty}
        id={property.id}
        title={rent ? t("markRentedTitle") : t("markSoldTitle")}
        description={t("markClosedDescription", { title: property.title })}
        confirmLabel={rent ? t("markRented") : t("markSold")}
        label={rent ? t("markRentedLabel", { title: property.title }) : t("markSoldLabel", { title: property.title })}
        tone="neutral"
      >
        <CircleCheckBig className="size-4" aria-hidden="true" />
      </ConfirmAction>
    );
  }

  /** Moderatorun səbəbi (#202): rədd, düzəliş istəyi və ya dayandırma — sahib nəyi düzəldəcəyini görsün. */
  function ModerationNote({ property }: { property: CabinetProperty }) {
    if (!property.moderationNote || !(MODERATION_HOLD_STATUSES as readonly string[]).includes(property.status)) return null;
    return (
      <p className="mt-2 flex items-start gap-1.5 rounded-sm border border-warning/30 bg-warning-bg px-2.5 py-2 text-xs text-ink [overflow-wrap:anywhere]">
        <MessageSquareWarning className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden="true" />
        <span>
          <span className="font-medium">{t("moderationNote")}</span> {property.moderationNote}
        </span>
      </p>
    );
  }

  // Rəqəmli tarix dildən asılı deyil və dar ekranda nişanı qısa saxlayır.

  /** Premium göstəricisi (#109): aktivdirsə bitmə tarixi, yoxsa dərc olunmuş elanda paket keçidi. */
  function PremiumControl({ property }: { property: CabinetProperty }) {
    const active = property.isFeatured && (property.featuredUntil === null || property.featuredUntil.getTime() > now);
    if (active) {
      return (
        <Badge tone="gold" className="whitespace-normal">
          <Crown className="size-3.5 shrink-0" aria-hidden="true" />
          {property.featuredUntil ? t("premiumUntil", { date: formatLocalizedDate(property.featuredUntil, locale as Locale, "numeric") ?? "" }) : t("premium")}
        </Badge>
      );
    }
    if (packageCount === 0 || property.status !== PROPERTY_STATUSES.PUBLISHED) return null;
    return (
      <ButtonLink href={localizePath(`/kabinet/paketler?elan=${property.id}`, locale)} variant="ghost" size="sm" aria-label={t("promoteLabel", { title: property.title })}>
        <Crown className="size-4" aria-hidden="true" />{t("promote")}
      </ButtonLink>
    );
  }

  function PropertyThumbnail({ property }: { property: CabinetProperty }) {
    return (
      <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-xs bg-beige text-center text-[0.65rem] leading-tight text-ink-muted">
        {property.images[0]?.url ? (
          <Image
            src={property.images[0].url}
            alt=""
            fill
            unoptimized={isUnoptimizedImage(property.images[0].url)}
            sizes="64px"
            className="object-cover"
          />
        ) : (
          t("noImage")
        )}
      </div>
    );
  }

  function renderPropertyCard(property: CabinetProperty) {
    const status = propertyStatus(property);
    return (
      <article className="min-w-0 rounded-xl border border-line bg-paper p-4 shadow-sm">
        <div className="flex min-w-0 items-start gap-3">
          <PropertyThumbnail property={property} />
          <div className="min-w-0 flex-1">
            <h2 className="font-medium text-ink [overflow-wrap:anywhere]">{property.title}</h2>
            <p className="mt-2 text-sm font-medium text-ink-soft tabular-nums">
              {formatPrice(property.price, property.currency)}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2"><ExpiryControls property={property} /><PremiumControl property={property} /></div>
            <ModerationNote property={property} />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3">
          <Badge tone={PROPERTY_STATUS_TONE[status] ?? "neutral"}>{t(`status.${STATUS_KEYS[status]}`)}</Badge>
          <div className="flex items-center gap-1">
            <CloseControl property={property} />
            <ButtonLink href={localizePath(`/kabinet/elanlar/${property.id}`, locale)} variant="ghost" size="sm" aria-label={t("editLabel", { title: property.title })}>
              <Pencil className="size-4" aria-hidden="true" />{t("edit")}
            </ButtonLink>
            <ConfirmAction action={deletePublicProperty} id={property.id} title={t("deleteTitle")} description={t("deleteDescription", { title: property.title })} confirmLabel={t("delete")} label={t("deleteLabel", { title: property.title })}>
              <Trash2 className="size-4" aria-hidden="true" />
            </ConfirmAction>
          </div>
        </div>
      </article>
    );
  }

  function renderPropertyList(items: readonly CabinetProperty[]) {
    return (
      <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-paper shadow-xs">
        {items.map((property) => {
          const status = propertyStatus(property);
          return (
            <li key={property.id} className="flex min-w-0 items-center gap-4 p-5">
              <PropertyThumbnail property={property} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">{property.title}</p>
                <p className="mt-1 text-sm text-ink-soft tabular-nums">
                  {formatPrice(property.price, property.currency)}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2"><ExpiryControls property={property} /><PremiumControl property={property} /></div>
                <ModerationNote property={property} />
              </div>
              <Badge tone={PROPERTY_STATUS_TONE[status] ?? "neutral"}>
                {t(`status.${STATUS_KEYS[status]}`)}
              </Badge>
              <CloseControl property={property} />
              <ButtonLink href={localizePath(`/kabinet/elanlar/${property.id}`, locale)} variant="outline" size="sm">
                <Pencil className="size-4" aria-hidden="true" />{t("edit")}
              </ButtonLink>
              <ConfirmAction action={deletePublicProperty} id={property.id} title={t("deleteTitle")} description={t("deleteDescription", { title: property.title })} confirmLabel={t("delete")} label={t("deleteLabel", { title: property.title })}>
                <Trash2 className="size-4" aria-hidden="true" />
              </ConfirmAction>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="min-w-0">
        {params.yeni === "1" && <AnalyticsEventBeacon event="submission_complete" payload={{ content_type: "property", status: "success" }} />}
        <PageHeader
          contained
          compact
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("count", { count: properties.length })}
          actions={
            <ButtonLink href={localizePath("/kabinet/elanlar/yeni", locale)} size="sm">
              <Plus className="size-4" aria-hidden="true" />
              {t("new")}
            </ButtonLink>
          }
        />

        {params.yeni === "1" && (
          params.yoxlama === "1" ? (
            // Avtomatik moderasiya elanı saxladı (#159) — səbəb açıqlanmır, moderator baxır.
            <p role="status" className="mt-6 rounded-xs border border-warning/30 bg-warning-bg px-4 py-3 text-sm text-ink">
              {t("heldForReview")}
            </p>
          ) : (
            <p role="status" className="mt-6 rounded-xs border border-success/30 bg-success-bg px-4 py-3 text-sm text-success">
              {t("submitted")}
            </p>
          )
        )}

        <div className="mt-8">
          <AdaptiveDataList
            items={properties}
            getKey={(property) => property.id}
            renderCard={renderPropertyCard}
            renderTable={renderPropertyList}
            empty={
              <EmptyState
                title={t("emptyTitle")}
                description={t("emptyDescription")}
                action={{
                  label: t("emptyAction"),
                  href: localizePath("/kabinet/elanlar/yeni", locale),
                  localized: false,
                }}
              />
            }
          />
        </div>
    </div>
  );
}
