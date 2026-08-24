import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { EmptyState } from "@/components/ui/states";
import { formatDateTime, formatPrice } from "@/lib/utils";
import { ACCOUNT_TYPE_LABELS, LISTING_TYPE_LABELS, PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getModerationQueue } from "@/lib/queries";
import { ApprovePropertyButton, RejectPropertyButton } from "./moderation-forms";

export const metadata: Metadata = { title: "Moderasiya" };
export const dynamic = "force-dynamic";

export default async function AdminModerationPage() {
  await requireAdminRead(PERMISSIONS.PROPERTY_MANAGE);
  const queue = await getModerationQueue();

  return (
    <>
      <AdminPageHeader
        title="Moderasiya"
        description="Mülk sahibi və ya təsdiqlənməmiş agentliyin göndərdiyi elanlar — dərc olunmadan əvvəl burada nəzərdən keçirilir."
        breadcrumbs={[{ label: "İdarə paneli", href: "/admin" }, { label: "Moderasiya" }]}
      />

      {queue.length === 0 ? (
        <EmptyState title="Növbə boşdur" description="Təsdiq gözləyən elan yoxdur." />
      ) : (
        <AdminCard bodyClassName="p-0">
          <ul className="divide-y divide-line">
            {queue.map((property) => {
              const image = property.images[0];
              return (
                <li
                  key={property.id}
                  className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-xs bg-beige">
                      {image && (
                        <Image src={image.url} alt={image.alt} fill unoptimized sizes="64px" className="object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/admin/emlaklar/${property.id}`}
                        className="truncate text-sm font-medium text-ink hover:text-gold-deep [overflow-wrap:anywhere]"
                      >
                        {property.title}
                      </Link>
                      <p className="mt-0.5 truncate text-xs text-ink-muted">
                        {LISTING_TYPE_LABELS[property.listingType as keyof typeof LISTING_TYPE_LABELS] ?? property.listingType}
                        {" · "}
                        {formatPrice(property.price, property.currency)}
                        {property.type && ` · ${property.type.name}`}
                        {property.city && ` · ${property.city.name}`}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-ink-muted">
                        {property.author?.name ?? "Naməlum"} ({property.author?.email})
                        {property.author && ` · ${ACCOUNT_TYPE_LABELS[property.author.accountType as keyof typeof ACCOUNT_TYPE_LABELS] ?? property.author.accountType}`}
                        {property.author?.agency && !property.author.agency.isVerified && (
                          <Badge tone="warning" className="ml-1.5">Təsdiqlənməmiş agentlik</Badge>
                        )}
                        {" · "}
                        {formatDateTime(property.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
                    <ApprovePropertyButton id={property.id} title={property.title} />
                    <RejectPropertyButton id={property.id} title={property.title} />
                  </div>
                </li>
              );
            })}
          </ul>
        </AdminCard>
      )}
    </>
  );
}
