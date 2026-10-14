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
    reason: (text: string) => `Səbəb: ${text}`,
    agencyLinkJoinedTitle: "Komandaya yeni agent qoşuldu",
    agencyLinkJoined: (name: string, agency: string) => `${name} dəvət linki ilə «${agency}» komandasına qoşuldu. Komandanı «Komanda» bölməsində idarə edə bilərsiniz.`,
    agencyVerifiedTitle: "Agentliyiniz təsdiqləndi",
    agencyVerified: (agency: string) => `«${agency}» təsdiqləndi və agentliklər kataloqunda görünür. Profilinizi tamamlayın — loqo, örtük və filiallar müştəri etimadını artırır.`,
    agencyReviewRejectedTitle: "Agentlik müraciətiniz rədd edildi",
    agencyReviewRejected: (agency: string) => `«${agency}» profili təsdiqlənmədi. Məlumatları düzəldib profili yadda saxlayın — müraciət yenidən baxışa düşəcək.`,
    agentVerifiedTitle: "Agent profiliniz təsdiqləndi",
    agentVerified: (name: string) => `${name}, agent profiliniz təsdiqləndi və saytda dərc olundu.`,
    agentReviewRejectedTitle: "Agent profiliniz təsdiqlənmədi",
    agentReviewRejected: (name: string) => `${name}, agent profiliniz təsdiqlənmədi. Məlumatları düzəldib profili yadda saxlayın — müraciət yenidən baxışa düşəcək.`,
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
    reason: (text: string) => `Reason: ${text}`,
    agencyLinkJoinedTitle: "A new agent joined your team",
    agencyLinkJoined: (name: string, agency: string) => `${name} joined the “${agency}” team using your invite link. You can manage the team in the Team section.`,
    agencyVerifiedTitle: "Your agency has been verified",
    agencyVerified: (agency: string) => `“${agency}” has been verified and now appears in the agency directory. Complete your profile — a logo, cover image and branches build client trust.`,
    agencyReviewRejectedTitle: "Your agency application was rejected",
    agencyReviewRejected: (agency: string) => `The “${agency}” profile was not verified. Correct the details and save your profile — the application will be reviewed again.`,
    agentVerifiedTitle: "Your agent profile has been verified",
    agentVerified: (name: string) => `${name}, your agent profile has been verified and published on the site.`,
    agentReviewRejectedTitle: "Your agent profile was not verified",
    agentReviewRejected: (name: string) => `${name}, your agent profile was not verified. Correct the details and save your profile — it will be reviewed again.`,
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
    reason: (text: string) => `Причина: ${text}`,
    agencyLinkJoinedTitle: "В команду вступил новый агент",
    agencyLinkJoined: (name: string, agency: string) => `${name} присоединился к команде «${agency}» по ссылке-приглашению. Управлять командой можно в разделе «Команда».`,
    agencyVerifiedTitle: "Ваше агентство подтверждено",
    agencyVerified: (agency: string) => `«${agency}» подтверждено и отображается в каталоге агентств. Заполните профиль — логотип, обложка и филиалы повышают доверие клиентов.`,
    agencyReviewRejectedTitle: "Заявка агентства отклонена",
    agencyReviewRejected: (agency: string) => `Профиль «${agency}» не подтверждён. Исправьте данные и сохраните профиль — заявка будет рассмотрена повторно.`,
    agentVerifiedTitle: "Ваш профиль агента подтверждён",
    agentVerified: (name: string) => `${name}, ваш профиль агента подтверждён и опубликован на сайте.`,
    agentReviewRejectedTitle: "Профиль агента не подтверждён",
    agentReviewRejected: (name: string) => `${name}, ваш профиль агента не подтверждён. Исправьте данные и сохраните профиль — он будет рассмотрен повторно.`,
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

/** Səbəb varsa mətnin sonuna ayrıca cümlə kimi əlavə olunur. */
function withReason(content: string, copy: NoticeCopy, reason: string | null | undefined): string {
  const text = reason?.trim();
  return text ? `${content} ${copy.reason(text)}` : content;
}

/** Agentə: qoşulma sorğusunun nəticəsi; rədd edilibsə səbəbi ilə (#157). */
export async function noticeAgencyDecision(input: {
  userId: string;
  employeeId: string;
  /** Qərar verilən cəhdin vaxtı (`AgencyEmployee.invitedAt`). */
  attemptAt: Date;
  agencyName: string;
  approved: boolean;
  reason?: string | null;
}): Promise<void> {
  await notifyAccount(
    input.userId,
    NOTIFICATION_TYPES.AGENCY_TEAM,
    "/kabinet",
    `agency-decision:${input.employeeId}:${attemptKey(input.attemptAt)}:${input.approved ? "approved" : "rejected"}`,
    (copy) => input.approved
      ? { title: copy.agencyApprovedTitle, content: copy.agencyApproved(input.agencyName) }
      : { title: copy.agencyRejectedTitle, content: withReason(copy.agencyRejected(input.agencyName), copy, input.reason) },
  );
}

/** Agentlik sahibinə: agent dəvət linki ilə komandaya birbaşa qoşuldu (#157). */
export async function noticeAgencyLinkJoined(input: {
  ownerUserId: string;
  employeeId: string;
  attemptAt: Date;
  agentName: string;
  agencyName: string;
}): Promise<void> {
  await notifyAccount(
    input.ownerUserId,
    NOTIFICATION_TYPES.AGENCY_TEAM,
    "/kabinet/komanda",
    `agency-link:${input.employeeId}:${attemptKey(input.attemptAt)}`,
    (copy) => ({ title: copy.agencyLinkJoinedTitle, content: copy.agencyLinkJoined(input.agentName, input.agencyName) }),
  );
}

/**
 * Agentlik və ya agent profilinin təsdiq mərkəzindəki nəticəsi (#157). Rədd edilibsə
 * səbəb bildirişə və e-poçta yazılır; təkrar açar qərarın vaxtını daşıyır — profil
 * yenidən göndərilib ikinci dəfə rədd edilə bilər.
 */
export async function noticeAccountReview(input: {
  userId: string;
  kind: "agency" | "agent";
  subjectId: string;
  name: string;
  approved: boolean;
  decidedAt: Date;
  reason?: string | null;
}): Promise<void> {
  await notifyAccount(
    input.userId,
    NOTIFICATION_TYPES.ACCOUNT_REVIEW,
    "/kabinet/profil",
    `account-review:${input.kind}:${input.subjectId}:${attemptKey(input.decidedAt)}:${input.approved ? "approved" : "rejected"}`,
    (copy) => {
      if (input.kind === "agency") {
        return input.approved
          ? { title: copy.agencyVerifiedTitle, content: copy.agencyVerified(input.name) }
          : { title: copy.agencyReviewRejectedTitle, content: withReason(copy.agencyReviewRejected(input.name), copy, input.reason) };
      }
      return input.approved
        ? { title: copy.agentVerifiedTitle, content: copy.agentVerified(input.name) }
        : { title: copy.agentReviewRejectedTitle, content: withReason(copy.agentReviewRejected(input.name), copy, input.reason) };
    },
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
