import { prisma } from "@/lib/prisma";
import { NOTIFICATION_TYPES, type Locale, type NotificationType } from "@/lib/constants";
import { sendEmail } from "@/lib/email";
import { emailHref, escapeHtml } from "@/lib/email-html";
import { siteUrl } from "@/config/site";
import { localizePath } from "@/i18n/path-locale";

/**
 * İctimai hesaba gedən bildirişlər: kabinetdəki bildiriş + e-poçt.
 *
 * Bildiriş mətni bazaya yazılır, ona görə alıcının dilində qurulur (`User.locale`).
 * Göndəriş heç vaxt atmır — əsas yazı (sorğu, müraciət) artıq saxlanılıb və
 * bildiriş xətası onu uğursuz göstərməməlidir.
 */

const localeOf = (value: string | null | undefined): Locale => (value === "en" || value === "ru" ? value : "az");

const COPY = {
  az: {
    agencyRequestTitle: "Yeni qoşulma sorğusu",
    agencyRequest: (name: string, agency: string) => `${name} «${agency}» agentliyinə agent kimi qoşulmaq istəyir. Sorğunu «Komanda» bölməsində təsdiqləyin və ya rədd edin.`,
    agencyApprovedTitle: "Agentliyə qəbul olundunuz",
    agencyApproved: (agency: string) => `«${agency}» sorğunuzu təsdiqlədi. Elanlarınızda artıq agentliyin adı görünür.`,
    agencyRejectedTitle: "Qoşulma sorğusu rədd edildi",
    agencyRejected: (agency: string) => `«${agency}» qoşulma sorğunuzu rədd etdi.`,
    leadTitle: "Elanınıza yeni müraciət",
    lead: (title: string, name: string) => `${name} «${title}» elanınızla maraqlanır. Əlaqə məlumatı kabinetdəki «Müraciətlər» bölməsindədir.`,
    open: "Kabinetdə aç",
  },
  en: {
    agencyRequestTitle: "New join request",
    agencyRequest: (name: string, agency: string) => `${name} wants to join “${agency}” as an agent. Approve or reject the request in the Team section.`,
    agencyApprovedTitle: "You have joined the agency",
    agencyApproved: (agency: string) => `“${agency}” approved your request. Your listings now show the agency name.`,
    agencyRejectedTitle: "Join request rejected",
    agencyRejected: (agency: string) => `“${agency}” rejected your join request.`,
    leadTitle: "New enquiry for your listing",
    lead: (title: string, name: string) => `${name} is interested in your listing “${title}”. Contact details are in the Enquiries section of your account.`,
    open: "Open in your account",
  },
  ru: {
    agencyRequestTitle: "Новый запрос на присоединение",
    agencyRequest: (name: string, agency: string) => `${name} хочет присоединиться к агентству «${agency}» как агент. Одобрите или отклоните запрос в разделе «Команда».`,
    agencyApprovedTitle: "Вы присоединились к агентству",
    agencyApproved: (agency: string) => `«${agency}» одобрило ваш запрос. Теперь в ваших объявлениях отображается название агентства.`,
    agencyRejectedTitle: "Запрос на присоединение отклонён",
    agencyRejected: (agency: string) => `«${agency}» отклонило ваш запрос на присоединение.`,
    leadTitle: "Новая заявка по вашему объявлению",
    lead: (title: string, name: string) => `${name} интересуется вашим объявлением «${title}». Контакты — в разделе «Заявки» личного кабинета.`,
    open: "Открыть в кабинете",
  },
} as const;

type NoticeCopy = (typeof COPY)[Locale];

async function notifyAccount(
  userId: string,
  type: NotificationType,
  path: string,
  dedupeKey: string,
  build: (copy: NoticeCopy) => { title: string; content: string },
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, locale: true, isActive: true },
    });
    if (!user?.isActive) return;
    const locale = localeOf(user.locale);
    const copy = COPY[locale];
    const { title, content } = build(copy);
    await prisma.notification.create({
      data: { userId, type, title, content, actionUrl: path, dedupeKey },
    }).catch(() => undefined);
    const url = siteUrl(localizePath(path, locale));
    await sendEmail({
      to: user.email,
      subject: title,
      html: `<p>${escapeHtml(content)}</p><p><a href="${emailHref(url)}">${copy.open}</a></p>`,
    });
  } catch (error) {
    console.error("[notice] hesab bildirişi göndərilmədi:", error);
  }
}

/**
 * Komanda bildirişinin təkrar açarı cəhd üzrədir: rədd edilmiş sorğu eyni
 * `AgencyEmployee.id` ilə yenidən açılır (`invitedAt` yenilənir). Açar yalnız id-dən
 * qurulsaydı, ikinci cəhdin bildirişi unikal açara dəyib səssizcə itərdi.
 */
function attemptKey(attemptAt: Date | string): string {
  return new Date(attemptAt).getTime().toString(36);
}

/** Agentlik sahibinə: agent qeydiyyatda agentliyi seçdi. */
export async function noticeAgencyJoinRequest(input: {
  ownerUserId: string;
  employeeId: string;
  /** Sorğunun bu cəhdinin vaxtı (`AgencyEmployee.invitedAt`). */
  attemptAt: Date;
  applicantName: string;
  agencyName: string;
}): Promise<void> {
  await notifyAccount(
    input.ownerUserId,
    NOTIFICATION_TYPES.AGENCY_TEAM,
    "/kabinet/komanda",
    `agency-request:${input.employeeId}:${attemptKey(input.attemptAt)}`,
    (copy) => ({ title: copy.agencyRequestTitle, content: copy.agencyRequest(input.applicantName, input.agencyName) }),
  );
}

/** Agentə: qoşulma sorğusunun nəticəsi. */
export async function noticeAgencyDecision(input: {
  userId: string;
  employeeId: string;
  /** Qərar verilən cəhdin vaxtı (`AgencyEmployee.invitedAt`). */
  attemptAt: Date;
  agencyName: string;
  approved: boolean;
}): Promise<void> {
  await notifyAccount(
    input.userId,
    NOTIFICATION_TYPES.AGENCY_TEAM,
    "/kabinet",
    `agency-decision:${input.employeeId}:${attemptKey(input.attemptAt)}:${input.approved ? "approved" : "rejected"}`,
    (copy) => input.approved
      ? { title: copy.agencyApprovedTitle, content: copy.agencyApproved(input.agencyName) }
      : { title: copy.agencyRejectedTitle, content: copy.agencyRejected(input.agencyName) },
  );
}

/** Elan sahibinə: elanından yeni müraciət gəldi. */
export async function noticeListingLead(input: {
  userId: string;
  leadId: string;
  propertyTitle: string;
  visitorName: string;
}): Promise<void> {
  await notifyAccount(
    input.userId,
    NOTIFICATION_TYPES.LISTING_LEAD,
    "/kabinet/muracietler",
    `listing-lead:${input.leadId}`,
    (copy) => ({ title: copy.leadTitle, content: copy.lead(input.propertyTitle, input.visitorName) }),
  );
}
