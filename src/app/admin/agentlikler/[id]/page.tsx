import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, Check, ExternalLink, ShieldCheck, ShieldX, X } from "lucide-react";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminForm } from "@/components/admin/form-shell";
import { AdminInput, AdminTextarea, FullWidth } from "@/components/admin/form-fields";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { ReasonAction } from "@/components/admin/reason-action";
import { ImageDropzone } from "@/components/admin/image-dropzone";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminI18n } from "@/lib/admin-i18n";
import { prisma } from "@/lib/prisma";
import { countAgencyOffers } from "@/lib/agency-profile";
import { AGENCY_EMPLOYEE_SOURCES, AGENCY_EMPLOYEE_STATUSES, PERMISSIONS } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import { getAgencyOffices, getOfficeCityOptions } from "@/lib/accounts/agency-offices";
import { AgencyOfficeEditor } from "../agency-office-editor";
import { localizePath } from "@/i18n/path-locale";
import { AgencyLogoEditor } from "../agency-logo-editor";
import {
  approveAgencyEmployee,
  rejectAgencyApplication,
  rejectAgencyEmployee,
  toggleAgencyVerification,
  updateAgencyByAdmin,
} from "../actions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const agency = await prisma.agency.findUnique({ where: { id }, select: { name: true } });
  return { title: agency?.name ?? "—" };
}

/**
 * Agentliyin panel kartı (#155): profil redaktəsi, loqo, təsdiq, komanda və hesab —
 * əvvəl agentlik yalnız siyahıda təsdiq açarı və loqo ilə idarə olunurdu, təsvir,
 * telefon, ünvan kimi sahələri yalnız sahib özü kabinetdən dəyişə bilirdi.
 */
export default async function AdminAgencyEditPage({ params }: Props) {
  const { id } = await params;
  await requireAdminRead(PERMISSIONS.USER_MANAGE);
  const { t, locale } = await getAdminI18n();
  const agency = await prisma.agency.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, isActive: true, createdAt: true, companyTaxId: true } },
      employees: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { invitedAt: "desc" },
      },
      _count: { select: { agentProfiles: true } },
    },
  });
  if (!agency) notFound();
  const [offerMap, offices, cities] = await Promise.all([
    countAgencyOffers([agency]),
    getAgencyOffices(agency.id),
    getOfficeCityOptions(),
  ]);
  const offers = offerMap.get(agency.id) ?? { total: 0, sale: 0, rent: 0 };
  const sourceLabel = (source: string) =>
    source === AGENCY_EMPLOYEE_SOURCES.REQUEST
      ? t("pages.agents.qosulmaSorgusu")
      : source === AGENCY_EMPLOYEE_SOURCES.LINK
        ? t("pages.agencyHub.inviteLinkSource")
        : t("pages.agents.devet");

  return (
    <>
      <AdminPageHeader
        title={agency.name}
        description={t("pages.agencyHub.editDescription")}
        breadcrumbs={[
          { label: t("pages.agents.idarePaneli"), href: "/admin" },
          { label: t("pages.agents.agentlikler"), href: "/admin/agentlikler" },
          { label: agency.name },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {agency.isVerified && (
              <a
                href={localizePath(`/agentlikler/${agency.slug}`, locale)}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClassName("outline", "sm", false, "min-h-11")}
              >
                <ExternalLink className="size-4" aria-hidden="true" />
                {t("pages.agencyHub.viewPublic")}
              </a>
            )}
            {!agency.isVerified && !agency.rejectedAt && (
              <ReasonAction
                action={rejectAgencyApplication}
                id={agency.id}
                label={t("pages.agencyHub.rejectNamed", { name: agency.name })}
                title={t("pages.agencyHub.rejectAgencyTitle")}
                description={t("pages.agencyHub.rejectAgencyDescription", { name: agency.name })}
                confirmLabel={t("pages.agencyHub.reject")}
                presets={[
                  t("pages.agencyHub.rejectPresets.agencyTaxId"),
                  t("pages.agencyHub.rejectPresets.agencyBrand"),
                  t("pages.agencyHub.rejectPresets.agencyContact"),
                  t("pages.agencyHub.rejectPresets.agencyDuplicate"),
                ]}
                className="inline-flex min-h-11 w-auto items-center gap-2 px-3 text-sm"
              >
                <X className="size-4" aria-hidden="true" />
                {t("pages.agencyHub.reject")}
              </ReasonAction>
            )}
            <ConfirmAction
              action={toggleAgencyVerification}
              id={agency.id}
              label={agency.isVerified ? t("pages.common.tesdiqiniLegvEt", { p0: agency.name }) : t("pages.common.tesdiqle2", { p0: agency.name })}
              title={agency.isVerified ? t("pages.misc.tesdiqiLegvEtmek") : t("pages.misc.agentliyiTesdiqlemek")}
              description={agency.isVerified ? t("pages.misc.agentlikIctimaiSehifedenGizledilecek") : t("pages.misc.agentlikIctimaiAgentliklerSehifesinde")}
              confirmLabel={agency.isVerified ? t("pages.misc.legvEt") : t("pages.misc.tesdiqle")}
              tone={agency.isVerified ? "danger" : "neutral"}
              className="inline-flex min-h-11 w-auto items-center gap-2 px-3 text-sm"
            >
              {agency.isVerified ? <ShieldX className="size-4" aria-hidden="true" /> : <ShieldCheck className="size-4" aria-hidden="true" />}
              {agency.isVerified ? t("pages.agencyHub.unverify") : t("pages.agencyHub.verify")}
            </ConfirmAction>
          </div>
        }
      />

      {!agency.isVerified && agency.rejectedAt && (
        <p role="status" className="mb-4 flex items-start gap-2.5 rounded-md border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span className="[overflow-wrap:anywhere]">
            {t("pages.agencyHub.rejectedOn", { date: formatDateTime(agency.rejectedAt) })}
            {agency.rejectionReason ? ` ${t("pages.agencyHub.rejectionReasonShort", { reason: agency.rejectionReason })}` : ""}
          </span>
        </p>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {agency.isVerified
          ? <Badge tone="success">{t("pages.agents.tesdiqlenib")}</Badge>
          : agency.rejectedAt
            ? <Badge tone="danger">{t("pages.agencyHub.rejected")}</Badge>
            : <Badge tone="warning">{t("pages.agents.tesdiqGozleyir")}</Badge>}
        {!agency.user.isActive && <Badge tone="neutral">{t("pages.agents.deaktivHesab")}</Badge>}
        <Badge tone="neutral">{t("pages.agencyHub.offers", { total: offers.total, sale: offers.sale, rent: offers.rent })}</Badge>
        <Badge tone="neutral">{t("pages.agencyHub.agentCount", { count: agency._count.agentProfiles })}</Badge>
        <Badge tone="neutral">{t("pages.agencyHub.views", { count: agency.viewCount })}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <AdminCard title={t("pages.agencyHub.profileTitle")} description={t("pages.agencyHub.profileDescription")}>
          <AdminForm action={updateAgencyByAdmin} submitLabel={t("pages.agencyHub.save")}>
            <input type="hidden" name="id" value={agency.id} />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FullWidth>
                <AdminInput name="name" label={t("pages.agencyHub.name")} required defaultValue={agency.name} maxLength={160} />
              </FullWidth>
              <FullWidth>
                <AdminTextarea name="description" label={t("pages.agencyHub.descriptionField")} rows={5} maxLength={2000} defaultValue={agency.description ?? ""} />
              </FullWidth>
              <AdminInput name="phone" label={t("pages.agencyHub.phone")} type="tel" defaultValue={agency.phone ?? ""} maxLength={30} hint={t("pages.agencyHub.phoneHint")} />
              <AdminInput name="whatsapp" label={t("pages.agencyHub.whatsapp")} type="tel" defaultValue={agency.whatsapp ?? ""} maxLength={30} />
              <AdminInput name="email" label={t("pages.agencyHub.email")} type="email" defaultValue={agency.email ?? ""} maxLength={200} />
              <AdminInput name="workingHours" label={t("pages.agencyHub.hours")} defaultValue={agency.workingHours ?? ""} maxLength={120} hint={t("pages.agencyHub.hoursHint")} />
              <FullWidth>
                <AdminInput name="address" label={t("pages.agencyHub.address")} defaultValue={agency.address ?? ""} maxLength={240} />
              </FullWidth>
              <AdminInput name="website" label={t("pages.agencyHub.website")} type="url" placeholder="https://" defaultValue={agency.website ?? ""} />
              <AdminInput name="instagram" label={t("pages.agencyHub.instagram")} defaultValue={agency.instagram ?? ""} maxLength={31} hint={t("pages.agencyHub.instagramHint")} />
              <AdminInput
                name="companyTaxId"
                label={t("pages.agencyHub.taxId")}
                inputMode="numeric"
                maxLength={12}
                defaultValue={agency.user.companyTaxId ?? ""}
                hint={t("pages.agencyHub.taxIdHint")}
              />
              <FullWidth>
                <ImageDropzone
                  name="cover"
                  label={t("pages.agencyHub.cover")}
                  folder="umumi"
                  mode="single"
                  initial={agency.coverUrl ? [{ url: agency.coverUrl, alt: "", isCover: true }] : []}
                  hint={t("pages.agencyHub.coverHint")}
                />
              </FullWidth>
            </div>
          </AdminForm>
        </AdminCard>

        <div className="flex flex-col gap-6">
          <AdminCard title={t("pages.agencyHub.logoTitle")}>
            <AgencyLogoEditor agencyId={agency.id} name={agency.name} logoUrl={agency.logoUrl} />
          </AdminCard>

          <AdminCard title={t("pages.agencyHub.officesTitle")} description={t("pages.agencyHub.officesDescription")}>
            <AgencyOfficeEditor
              agencyId={agency.id}
              offices={offices.map((office) => ({
                id: office.id,
                name: office.name,
                address: office.address,
                phone: office.phone,
                workingHours: office.workingHours,
                cityName: office.city?.name ?? null,
              }))}
              cities={cities}
            />
          </AdminCard>

          <AdminCard title={t("pages.agencyHub.ownerTitle")}>
            <dl className="flex flex-col gap-3 text-sm">
              <div><dt className="text-xs text-ink-muted">{t("pages.agencyHub.ownerName")}</dt><dd className="text-ink">{agency.user.name}</dd></div>
              <div><dt className="text-xs text-ink-muted">{t("pages.agencyHub.email")}</dt><dd className="break-all text-ink">{agency.user.email}</dd></div>
              {agency.user.phone && <div><dt className="text-xs text-ink-muted">{t("pages.agencyHub.phone")}</dt><dd className="text-ink">{agency.user.phone}</dd></div>}
              {agency.user.companyTaxId && <div><dt className="text-xs text-ink-muted">{t("pages.agencyHub.taxId")}</dt><dd className="tabular text-ink">{agency.user.companyTaxId}</dd></div>}
              <div><dt className="text-xs text-ink-muted">{t("pages.agencyHub.registeredAt")}</dt><dd className="text-ink">{formatDateTime(agency.user.createdAt)}</dd></div>
            </dl>
          </AdminCard>
        </div>
      </div>

      <AdminCard title={t("pages.agencyHub.teamTitle")} description={t("pages.agencyHub.teamDescription")} className="mt-6" bodyClassName="p-0">
        {agency.employees.length === 0 ? (
          <p className="p-5 text-sm text-ink-muted">{t("pages.agencyHub.teamEmpty")}</p>
        ) : (
          <ul className="divide-y divide-line">
            {agency.employees.map((employee) => (
              <li key={employee.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{employee.user.name}</p>
                  <p className="mt-0.5 truncate text-xs text-ink-muted">
                    {employee.user.email} · {sourceLabel(employee.source)}
                  </p>
                  {employee.status === AGENCY_EMPLOYEE_STATUSES.REJECTED && employee.decisionNote && (
                    <p className="mt-0.5 text-xs text-danger [overflow-wrap:anywhere]">
                      {t("pages.agencyHub.rejectionReasonShort", { reason: employee.decisionNote })}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {employee.status === AGENCY_EMPLOYEE_STATUSES.APPROVED && <Badge tone="success">{t("pages.agents.tesdiqlenib")}</Badge>}
                  {employee.status === AGENCY_EMPLOYEE_STATUSES.REJECTED && <Badge tone="neutral">{t("pages.agencyHub.rejected")}</Badge>}
                  {employee.status === AGENCY_EMPLOYEE_STATUSES.PENDING && (
                    <>
                      <Badge tone="warning">{t("pages.agents.tesdiqGozleyir")}</Badge>
                      <ConfirmAction
                        action={approveAgencyEmployee}
                        id={employee.id}
                        label={t("pages.common.tesdiqle", { p0: employee.user.name })}
                        title={t("pages.agents.emekdasiTesdiqlemek")}
                        description={t("pages.common.agentliyineEmekdasKimiElave", { p0: employee.user.name, p1: employee.user.email, p2: agency.name })}
                        confirmLabel={t("pages.agents.tesdiqle")}
                        tone="neutral"
                        className="size-11"
                      >
                        <Check className="size-4" aria-hidden="true" />
                      </ConfirmAction>
                      <ReasonAction
                        action={rejectAgencyEmployee}
                        id={employee.id}
                        label={t("pages.common.devetiniReddEt", { p0: employee.user.name })}
                        title={t("pages.agents.devetiReddEtmek")}
                        description={t("pages.common.ucunKomandaDevetiRedd", { p0: employee.user.name })}
                        confirmLabel={t("pages.agents.reddEt")}
                        presets={[t("pages.agencyHub.rejectPresets.teamUnknown"), t("pages.agencyHub.rejectPresets.teamProfile")]}
                        required={false}
                      >
                        <X className="size-4" aria-hidden="true" />
                      </ReasonAction>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      <p className="mt-6 text-sm">
        <Link href="/admin/agentlikler" className="font-medium text-gold-deep hover:underline">{t("pages.agencyHub.backToList")}</Link>
      </p>
    </>
  );
}
