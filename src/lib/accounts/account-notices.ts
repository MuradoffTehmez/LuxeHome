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
    agencyLeadTitle: "Agentliyinizə yeni müraciət",
    agencyLead: (name: string) => `${name} agentlik profilinizdən müraciət göndərdi. Əlaqə məlumatı kabinetdəki «Müraciətlər» bölməsindədir.`,
    leadRoutedTitle: "Sizə yeni müraciət yönləndirildi",
    leadRouted: (agency: string, subject: string, name: string) => `«${agency}» agentliyinə gələn müraciət sizə yönləndirildi: ${name} — ${subject}. Əlaqə məlumatı kabinetdəki «Müraciətlər» bölməsindədir.`,
    leadEscalationTitle: "Müraciət cavabsız qalıb",
    leadEscalation: (name: string, handler: string, minutes: number) => `${name} adlı müştərinin müraciətinə ${minutes} dəqiqədir cavab verilməyib (məsul: ${handler}). Müraciəti başqa agentə verə və ya özünüz əlaqə saxlaya bilərsiniz.`,
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
    listingArchivedTitle: "Elanınız dayandırıldı",
    listingArchived: (title: string) => `«${title}» elanı ziyarətçi şikayəti yoxlanıldıqdan sonra dayandırıldı. Məlumatları düzəldib elanı yenidən göndərə bilərsiniz.`,
    agentLeftTitle: "Agent komandadan çıxdı",
    agentLeft: (name: string, agency: string, count: number) => count > 0
      ? `${name} «${agency}» komandasından çıxdı və ${count} elanını agentliyə təhvil verdi. Elanlar artıq «Elanlarım» bölmənizdədir.`
      : `${name} «${agency}» komandasından çıxdı.`,
    listingsHandedTitle: "Sizə elan təhvil verildi",
    listingsHanded: (count: number, from: string, agency: string) => `«${agency}» komandasından çıxan ${from} adlı agentin ${count} elanı sizə təhvil verildi. Elanlar və onlara gələn müraciətlər kabinetinizdədir.`,
    listingClosedTitle: "Elanınız bağlandı",
    listingClosed: (title: string) => `«${title}» elanı satılmış və ya kirayəyə verilmiş kimi işarələndi. Səhvdirsə, bizimlə əlaqə saxlayın.`,
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
    agencyLeadTitle: "New enquiry for your agency",
    agencyLead: (name: string) => `${name} sent an enquiry from your agency profile. Contact details are in the Enquiries section of your account.`,
    leadRoutedTitle: "A new enquiry was assigned to you",
    leadRouted: (agency: string, subject: string, name: string) => `An enquiry to “${agency}” was assigned to you: ${name} — ${subject}. Contact details are in the Enquiries section of your account.`,
    leadEscalationTitle: "An enquiry is still unanswered",
    leadEscalation: (name: string, handler: string, minutes: number) => `The enquiry from ${name} has not been answered for ${minutes} minutes (assigned to ${handler}). You can reassign it to another agent or contact the client yourself.`,
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
    listingArchivedTitle: "Your listing was suspended",
    listingArchived: (title: string) => `The listing “${title}” was suspended after a visitor report was reviewed. You can correct the details and submit it again.`,
    agentLeftTitle: "An agent left your team",
    agentLeft: (name: string, agency: string, count: number) => count > 0
      ? `${name} left the “${agency}” team and handed over ${count} listings to the agency. They are now in your Listings section.`
      : `${name} left the “${agency}” team.`,
    listingsHandedTitle: "Listings were handed over to you",
    listingsHanded: (count: number, from: string, agency: string) => `${count} listings of ${from}, who left the “${agency}” team, were handed over to you. The listings and their enquiries are in your account.`,
    listingClosedTitle: "Your listing was closed",
    listingClosed: (title: string) => `The listing “${title}” was marked as sold or rented. If this is a mistake, please contact us.`,
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
    agencyLeadTitle: "Новая заявка в ваше агентство",
    agencyLead: (name: string) => `${name} отправил(а) заявку из профиля вашего агентства. Контакты — в разделе «Заявки» личного кабинета.`,
    leadRoutedTitle: "Вам передана новая заявка",
    leadRouted: (agency: string, subject: string, name: string) => `Заявка в агентство «${agency}» передана вам: ${name} — ${subject}. Контакты — в разделе «Заявки» личного кабинета.`,
    leadEscalationTitle: "Заявка остаётся без ответа",
    leadEscalation: (name: string, handler: string, minutes: number) => `На заявку клиента ${name} нет ответа уже ${minutes} мин. (ответственный: ${handler}). Передайте её другому агенту или свяжитесь с клиентом сами.`,
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
    listingArchivedTitle: "Ваше объявление приостановлено",
    listingArchived: (title: string) => `Объявление «${title}» приостановлено после проверки жалобы посетителя. Исправьте данные и отправьте его снова.`,
    agentLeftTitle: "Агент покинул команду",
    agentLeft: (name: string, agency: string, count: number) => count > 0
      ? `${name} покинул команду «${agency}» и передал агентству объявлений: ${count}. Они уже в разделе «Мои объявления».`
      : `${name} покинул команду «${agency}».`,
    listingsHandedTitle: "Вам переданы объявления",
    listingsHanded: (count: number, from: string, agency: string) => `Вам переданы объявления (${count}) агента ${from}, покинувшего команду «${agency}». Объявления и заявки по ним — в вашем кабинете.`,
    listingClosedTitle: "Ваше объявление закрыто",
    listingClosed: (title: string) => `Объявление «${title}» отмечено как проданное или сданное. Если это ошибка, свяжитесь с нами.`,
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

/** Agentlik sahibinə: agentlik profilindəki formadan müraciət (bölgü söndürülü və ya agent yoxdur). */
export async function noticeAgencyLead(input: { userId: string; leadId: string; visitorName: string }): Promise<void> {
  await notifyAccount(
    input.userId,
    NOTIFICATION_TYPES.LISTING_LEAD,
    "/kabinet/muracietler",
    `agency-lead:${input.leadId}`,
    (copy) => ({ title: copy.agencyLeadTitle, content: copy.agencyLead(input.visitorName) }),
  );
}

/**
 * Agentə: agentliyə gələn müraciət bölgü ilə ona düşdü (#161). Açar müraciət + alan üzrədir —
 * sahib müraciəti başqa agentə verəndə yeni agent də bildiriş alır.
 */
export async function noticeLeadRouted(input: {
  userId: string;
  leadId: string;
  agencyName: string;
  subject: string;
  visitorName: string;
}): Promise<void> {
  await notifyAccount(
    input.userId,
    NOTIFICATION_TYPES.LISTING_LEAD,
    "/kabinet/muracietler",
    `lead-routed:${input.leadId}:${input.userId}`,
    (copy) => ({ title: copy.leadRoutedTitle, content: copy.leadRouted(input.agencyName, input.subject, input.visitorName) }),
  );
}

/** Agentlik sahibinə: müraciət `LEAD_ESCALATION_MINUTES` dəqiqə cavabsız qaldı (#161). */
export async function noticeLeadEscalation(input: {
  userId: string;
  leadId: string;
  visitorName: string;
  handlerName: string;
  minutes: number;
}): Promise<void> {
  await notifyAccount(
    input.userId,
    NOTIFICATION_TYPES.LEAD_ESCALATION,
    "/kabinet/muracietler",
    `lead-escalation:${input.leadId}`,
    (copy) => ({ title: copy.leadEscalationTitle, content: copy.leadEscalation(input.visitorName, input.handlerName, input.minutes) }),
  );
}

/**
 * Elan sahibinə: şikayət yoxlanıldı və elan dayandırıldı və ya bağlandı (#159).
 * Dayandırmada admin səbəbi göndərilir — sahib elanı düzəldib yenidən göndərə bilsin.
 */
export async function noticeListingReportDecision(input: {
  userId: string;
  propertyId: string;
  propertyTitle: string;
  decision: "archived" | "closed";
  decidedAt: Date;
  reason?: string | null;
}): Promise<void> {
  await notifyAccount(
    input.userId,
    NOTIFICATION_TYPES.LISTING_REPORT,
    "/kabinet/elanlar",
    `listing-report:${input.propertyId}:${attemptKey(input.decidedAt)}:${input.decision}`,
    (copy) => input.decision === "archived"
      ? { title: copy.listingArchivedTitle, content: withReason(copy.listingArchived(input.propertyTitle), copy, input.reason) }
      : { title: copy.listingClosedTitle, content: copy.listingClosed(input.propertyTitle) },
  );
}

/** Agentlik sahibinə: agent komandadan özü çıxdı (#159) — təhvil verdiyi elan sayı ilə. */
export async function noticeAgentLeft(input: {
  ownerUserId: string;
  employeeId: string;
  leftAt: Date;
  agentName: string;
  agencyName: string;
  handedOver: number;
}): Promise<void> {
  await notifyAccount(
    input.ownerUserId,
    NOTIFICATION_TYPES.AGENCY_TEAM,
    input.handedOver > 0 ? "/kabinet/elanlar" : "/kabinet/komanda",
    `agency-left:${input.employeeId}:${attemptKey(input.leftAt)}`,
    (copy) => ({ title: copy.agentLeftTitle, content: copy.agentLeft(input.agentName, input.agencyName, input.handedOver) }),
  );
}

/** Agentə: komandadan çıxan həmkarının elanları ona təhvil verildi (#159). */
export async function noticeListingsHandedOver(input: {
  userId: string;
  employeeId: string;
  handedAt: Date;
  count: number;
  fromName: string;
  agencyName: string;
}): Promise<void> {
  await notifyAccount(
    input.userId,
    NOTIFICATION_TYPES.AGENCY_TEAM,
    "/kabinet/elanlar",
    `listings-handed:${input.employeeId}:${attemptKey(input.handedAt)}`,
    (copy) => ({ title: copy.listingsHandedTitle, content: copy.listingsHanded(input.count, input.fromName, input.agencyName) }),
  );
}
