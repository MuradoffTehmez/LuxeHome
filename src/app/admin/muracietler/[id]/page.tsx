import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, Mail, MessageSquare, Phone } from "lucide-react";
import { AdminCard, AdminPageHeader, StatusBadge } from "@/components/admin/admin-ui";
import { formatDateTime, formatPhone } from "@/lib/utils";
import {
  PERMISSIONS,
  type LeadSource,
  type LeadStatus,
} from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminLeadById, getAssignableUsers } from "@/lib/queries";
import { whatsappLink } from "@/config/site";
import { LeadForm } from "../lead-form";
import { getAdminT } from "@/lib/admin-i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.leads.muraciet") };
}
export const dynamic = "force-dynamic";

export default async function AdminLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getAdminT();
  await requireAdminRead(PERMISSIONS.LEAD_MANAGE);

  const { id } = await params;
  const [lead, users] = await Promise.all([getAdminLeadById(id), getAssignableUsers()]);

  if (!lead) notFound();

  return (
    <>
      <AdminPageHeader
        title={lead.name}
        description={`${t(`labels.leadSource.${lead.source as LeadSource}`)} · ${formatDateTime(lead.createdAt)}`}
        breadcrumbs={[
          { label: t("pages.leads.idarePaneli"), href: "/admin" },
          { label: t("pages.leads.muracietler"), href: "/admin/muracietler" },
          { label: lead.name },
        ]}
        actions={
          <StatusBadge
            status={lead.status as LeadStatus}
            label={t(`labels.leadStatus.${lead.status as LeadStatus}`)}
          />
        }
      />

      <div className="grid min-w-0 gap-6 xl:grid-cols-[1fr_1.1fr]">
        <div className="flex min-w-0 flex-col gap-6">
          <AdminCard title={t("pages.leads.elaqe")}>
            <dl className="flex flex-col gap-3 text-sm">
              <div className="flex min-w-0 items-center gap-2.5">
                <Phone className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                <dt className="sr-only">{t("pages.leads.telefon")}</dt>
                <dd className="tabular">
                  <a
                    href={`tel:${lead.phone}`}
                    className="tabular inline-flex min-h-11 items-center text-ink transition-colors hover:text-gold-deep"
                  >
                    {formatPhone(lead.phone)}
                  </a>
                </dd>
              </div>

              {lead.email && (
                <div className="flex min-w-0 items-center gap-2.5">
                  <Mail className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                  <dt className="sr-only">{t("pages.leads.ePoct")}</dt>
                  <dd className="min-w-0">
                    <a
                      href={`mailto:${lead.email}`}
                      className="inline-flex min-h-11 max-w-full items-center text-ink transition-colors hover:text-gold-deep [overflow-wrap:anywhere]"
                    >
                      {lead.email}
                    </a>
                  </dd>
                </div>
              )}

              <div className="flex min-w-0 items-center gap-2.5">
                <MessageSquare className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                <dt className="sr-only">{t("pages.leads.whatsapp")}</dt>
                <dd>
                  <a
                    href={whatsappLink(`Salam, ${lead.name}. Luxe Home Estate ilə əlaqə saxladığınız üçün təşəkkür edirik.`)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center text-ink transition-colors hover:text-gold-deep"
                  >
                    {t("pages.leads.whatsappDaYaz")}
                  </a>
                </dd>
              </div>

              {lead.property && (
                <div className="flex min-w-0 items-center gap-2.5">
                  <Building2 className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                  <dt className="sr-only">{t("pages.leads.elaqeliElan")}</dt>
                  <dd className="min-w-0">
                    <Link
                      href={`/admin/emlaklar/${lead.property.id}`}
                      className="inline-flex min-h-11 max-w-full items-center text-ink transition-colors hover:text-gold-deep [overflow-wrap:anywhere]"
                    >
                      {lead.property.title}
                    </Link>
                  </dd>
                </div>
              )}
            </dl>
          </AdminCard>

          <AdminCard title={t("pages.leads.mesaj")} description={lead.subject ?? undefined}>
            {/* Müştərinin mətni — redaktə edilmir, olduğu kimi göstərilir */}
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-ink-soft [overflow-wrap:anywhere]">
              {lead.message}
            </p>
          </AdminCard>
        </div>

        <LeadForm
          id={lead.id}
          status={lead.status}
          adminNote={lead.adminNote ?? ""}
          assigneeId={lead.assigneeId ?? ""}
          users={users}
        />
      </div>
    </>
  );
}
