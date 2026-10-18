import { prisma } from "@/lib/prisma";
import { isUniqueViolation } from "@/lib/media/upload-record";
import { NOTIFICATION_TYPES, type Locale, type NotificationType } from "@/lib/constants";
import { sendEmail } from "@/lib/email";
import { channelsForType, parseCategoryChannels } from "@/lib/notification-categories";
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

/** Şikayətçiyə bildirilən nəticə (#195). */
export type ReportOutcome = "confirmed" | "dismissed" | "closed";

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
    leadReminderTitle: "Müraciətə cavab gözlənilir",
    leadReminder: (name: string, duration: string) => `${name} adlı müştərinin müraciəti artıq ${duration} cavabsızdır. Müştəri ilə əlaqə saxlayın və kartda «Əlaqə saxladım» qeyd edin.`,
    leadEscalationTitle: "Müraciət cavabsız qalıb",
    leadEscalation: (name: string, handler: string, duration: string) => `${name} adlı müştərinin müraciəti artıq ${duration} cavabsızdır (məsul: ${handler}). Müraciəti başqa agentə verə və ya özünüz əlaqə saxlaya bilərsiniz.`,
    leadReassignTitle: "Müraciəti başqa agentə verin",
    leadReassign: (name: string, handler: string, duration: string) => `${name} adlı müştərinin müraciəti artıq ${duration} cavabsızdır (məsul: ${handler}). Müraciəti başqa agentə verməyi tövsiyə edirik.`,
    duration: (minutes: number) => minutes < 120 ? `${minutes} dəqiqə` : `${Math.round(minutes / 60)} saat`,
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
    appealAcceptedTitle: "Etirazınız qəbul edildi",
    appealAccepted: (title: string) => `«${title}» elanı üzrə etirazınız qəbul edildi və moderasiya qərarı ləğv olundu.`,
    appealRejectedTitle: "Etirazınız rədd edildi",
    appealRejected: (title: string) => `«${title}» elanı üzrə etirazınız müstəqil yoxlamadan sonra rədd edildi. Elanı düzəldib yenidən göndərə bilərsiniz.`,
    transferRequestedTitle: "Elanınız üçün köçürmə sorğusu",
    transferRequested: (title: string, agency: string) => `«${agency}» agentliyi «${title}» elanını öz agentliyinə köçürmək istəyir. Sorğuya «Köçürmələr» bölməsində baxın.`,
    transferSourceApprovedTitle: "Köçürmə sorğusu agentlik tərəfindən təsdiqləndi",
    transferSourceApproved: (title: string) => `«${title}» elanının köçürülməsini elanın agentliyi təsdiqlədi. Son qərarı platforma administratoru verəcək.`,
    transferRejectedTitle: "Köçürmə sorğusu rədd edildi",
    transferRejected: (title: string) => `«${title}» elanının köçürmə sorğusu rədd edildi.`,
    memberAccessTitle: "Agentlikdəki hüquqlarınız dəyişdi",
    memberAccess: (agency: string) => `«${agency}» agentliyində rolunuz və ya səlahiyyətləriniz yeniləndi. Dəyişikliklər kabinetinizdə artıq qüvvədədir.`,
    memberSuspendedTitle: "Agentlik mühitinə girişiniz dayandırıldı",
    memberSuspended: (agency: string) => `«${agency}» agentliyi sizin agentlik elanlarına və müraciətlərinə girişinizi dayandırdı. Şəxsi hesabınız və şəxsi elanlarınız toxunulmazdır.`,
    memberResumedTitle: "Agentlik mühitinə girişiniz bərpa olundu",
    memberResumed: (agency: string) => `«${agency}» agentliyi agentlik elanlarına və müraciətlərinə girişinizi bərpa etdi.`,
    listingAssignedTitle: "Sizə elan təyin edildi",
    listingAssigned: (title: string, agency: string) => `«${agency}» agentliyi «${title}» elanını sizə təyin etdi. Elan «Elanlarım» bölməsindədir.`,
    taskAssignedTitle: "Sizə yeni tapşırıq verildi",
    taskAssigned: (title: string, agency: string) => `«${agency}» agentliyində sizə «${title}» tapşırığı verildi. Tapşırıqlara kabinetdə baxın.`,
    taskCompletedTitle: "Tapşırıq tamamlandı",
    taskCompleted: (title: string, name: string) => `${name} «${title}» tapşırığını tamamladı.`,
    transferCompletedTitle: "Elan agentliyinizə köçürüldü",
    transferCompleted: (title: string) => `«${title}» elanı agentliyinizə köçürüldü və «Elanlarım» bölməsindədir. Əvvəlki agentliyin müraciətləri köçürülmür.`,
    transferMovedTitle: "Elan başqa agentliyə köçürüldü",
    transferMoved: (title: string, agency: string) => `«${title}» elanı təsdiqlənmiş sorğu əsasında «${agency}» agentliyinə köçürüldü. Köhnə müraciətlər sizdə qalır.`,
    listingRejectedTitle: "Elanınız rədd edildi",
    listingRejected: (title: string) => `«${title}» elanı moderasiyadan keçmədi. Səbəbi oxuyub elanı düzəldin və yenidən göndərin.`,
    listingNeedsInfoTitle: "Elanınız üçün düzəliş tələb olunur",
    listingNeedsInfo: (title: string) => `«${title}» elanı dərc olunmazdan əvvəl moderator düzəliş istəyir. Elanı redaktə edib yadda saxlayın — o yenidən yoxlamaya düşəcək.`,
    listingInfoRequestedTitle: "Elanınız barədə izahat istənilir",
    listingInfoRequested: (title: string) => `«${title}» elanı barədə ziyarətçi şikayəti yoxlanılır. Moderatorların sualını oxuyun və elanı düzəldin və ya bizimlə əlaqə saxlayın.`,
    promotionDecisionTitle: "İrəli çəkmə sorğunuza baxıldı",
    promotionDecision: (title: string, approved: boolean, days: number, note: string | null) => approved
      ? `«${title}» elanı ${days} gün siyahılarda irəli çəkiləcək.`
      : `«${title}» elanının irəli çəkmə sorğusu rədd edildi${note ? `: ${note}` : "."}`,
    vipDecisionTitle: "VIP sorğunuza baxıldı",
    vipDecision: (title: string, approved: boolean, days: number, note: string | null) => approved
      ? `«${title}» elanı ${days} günlük VIP statusu aldı.`
      : `«${title}» elanı üçün VIP sorğusu rədd edildi${note ? `: ${note}` : "."}`,
    vipRevokedTitle: "VIP statusu dayandırıldı",
    vipRevoked: (title: string, note: string | null) => `«${title}» elanının VIP statusu dayandırıldı${note ? `: ${note}` : "."}`,
    restrictionTitle: (lifted: boolean) => lifted ? "Hesab məhdudiyyəti götürüldü" : "Hesabınıza məhdudiyyət tətbiq olundu",
    restriction: (kind: string, reason: string, lifted: boolean) => lifted ? `«${kind}» məhdudiyyəti götürüldü: ${reason}` : `Tədbir: «${kind}». Səbəb: ${reason}. Kabinetdəki «Məhdudiyyətlər» bölməsindən etiraz edə bilərsiniz.`,
    restrictionKinds: { WARNING: "Xəbərdarlıq", EXTRA_VERIFICATION: "Əlavə təsdiq", POSTING_LIMIT: "Paylaşım limiti", MODERATION_REVIEW: "Moderator yoxlaması", TEMP_SUSPENSION: "Müvəqqəti məhdudiyyət", BLOCK: "Bloklama" } as Record<string, string>,
    newReviewTitle: "Sizə yeni rəy yazıldı",
    newReview: (target: string, rating: number) => `«${target}» haqqında ${rating} ulduzlu yeni rəy dərc olundu.`,
    subscriptionTitle: "Abunə statusu dəyişdi",
    subscription: (plan: string, active: boolean, until: string) => active ? `${plan} abunəsi aktivdir (${until}-dək).` : `${plan} abunəsi dayandırıldı.`,
    securityPasswordTitle: "Parolunuz dəyişdirildi",
    securityPassword: "Hesabınızın parolu dəyişdirildi və digər cihazlardakı sessiyalar bağlandı. Bunu siz etməmisinizsə, dərhal bizimlə əlaqə saxlayın.",
    securityLoginTitle: "Hesabınıza yeni cihazdan giriş edildi",
    securityLogin: (device: string, ip: string, at: string) => `${at} tarixində hesabınıza tanınmayan cihazdan giriş edildi (${device}, IP ${ip}). Bu siz deyilsinizsə, dərhal parolunuzu dəyişin və «Profil» bölməsində digər sessiyaları bağlayın.`,
    reviewReportTitle: "Rəydən şikayətinizə baxıldı",
    reviewReport: (target: string, hidden: boolean) => hidden
      ? `«${target}» haqqındakı rəydən şikayətiniz təsdiqləndi: rəy gizlədildi və reytinqdən çıxarıldı.`
      : `«${target}» haqqındakı rəyə baxıldı: rəy qaydaları pozmur və saytda qalır.`,
    reportOutcomeTitle: "Şikayətinizə baxıldı",
    reportOutcome: (title: string, outcome: ReportOutcome) => outcome === "confirmed"
      ? `«${title}» elanı barədə şikayətiniz təsdiqləndi və elana tədbir görüldü. Təşəkkür edirik.`
      : outcome === "dismissed"
        ? `«${title}» elanı barədə şikayətiniz yoxlanıldı, amma pozuntu təsdiqlənmədi.`
        : `«${title}» elanı barədə şikayətiniz bağlandı — elan artıq aktual deyil.`,
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
    leadReminderTitle: "An enquiry is waiting for your reply",
    leadReminder: (name: string, duration: string) => `The enquiry from ${name} has been unanswered for ${duration}. Contact the client and mark it as contacted on the enquiry card.`,
    leadEscalationTitle: "An enquiry is still unanswered",
    leadEscalation: (name: string, handler: string, duration: string) => `The enquiry from ${name} has been unanswered for ${duration} (assigned to ${handler}). You can reassign it to another agent or contact the client yourself.`,
    leadReassignTitle: "Reassign the enquiry",
    leadReassign: (name: string, handler: string, duration: string) => `The enquiry from ${name} has been unanswered for ${duration} (assigned to ${handler}). We recommend reassigning it to another agent.`,
    duration: (minutes: number) => minutes < 120 ? `${minutes} minutes` : `${Math.round(minutes / 60)} hours`,
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
    appealAcceptedTitle: "Your appeal was accepted",
    appealAccepted: (title: string) => `Your appeal about the listing “${title}” was accepted and the moderation decision was reversed.`,
    appealRejectedTitle: "Your appeal was rejected",
    appealRejected: (title: string) => `Your appeal about the listing “${title}” was rejected after an independent review. You can correct the listing and submit it again.`,
    transferRequestedTitle: "Transfer request for your listing",
    transferRequested: (title: string, agency: string) => `The agency “${agency}” wants to transfer the listing “${title}” to itself. Review the request in the “Transfers” section.`,
    transferSourceApprovedTitle: "The agency approved your transfer request",
    transferSourceApproved: (title: string) => `The listing’s agency approved the transfer of “${title}”. A platform administrator will make the final decision.`,
    transferRejectedTitle: "Transfer request rejected",
    transferRejected: (title: string) => `The transfer request for the listing “${title}” was rejected.`,
    memberAccessTitle: "Your agency rights changed",
    memberAccess: (agency: string) => `Your role or permissions at “${agency}” were updated. The changes are already in effect in your account.`,
    memberSuspendedTitle: "Your agency access was suspended",
    memberSuspended: (agency: string) => `“${agency}” suspended your access to its listings and enquiries. Your personal account and personal listings are not affected.`,
    memberResumedTitle: "Your agency access was restored",
    memberResumed: (agency: string) => `“${agency}” restored your access to its listings and enquiries.`,
    listingAssignedTitle: "A listing was assigned to you",
    listingAssigned: (title: string, agency: string) => `“${agency}” assigned the listing “${title}” to you. It is in “My listings”.`,
    taskAssignedTitle: "You have a new task",
    taskAssigned: (title: string, agency: string) => `You were given the task “${title}” at “${agency}”. See your tasks in the account.`,
    taskCompletedTitle: "Task completed",
    taskCompleted: (title: string, name: string) => `${name} completed the task “${title}”.`,
    transferCompletedTitle: "Listing transferred to your agency",
    transferCompleted: (title: string) => `The listing “${title}” was transferred to your agency and is in “My listings”. Enquiries of the previous agency are not transferred.`,
    transferMovedTitle: "Listing transferred to another agency",
    transferMoved: (title: string, agency: string) => `The listing “${title}” was transferred to the agency “${agency}” under an approved request. Its previous enquiries stay with you.`,
    listingRejectedTitle: "Your listing was rejected",
    listingRejected: (title: string) => `The listing “${title}” did not pass moderation. Read the reason, correct the listing and submit it again.`,
    listingNeedsInfoTitle: "Your listing needs changes",
    listingNeedsInfo: (title: string) => `A moderator has requested changes to the listing “${title}” before it can be published. Edit and save the listing — it will be reviewed again.`,
    listingInfoRequestedTitle: "Clarification requested for your listing",
    listingInfoRequested: (title: string) => `A visitor report about the listing “${title}” is being reviewed. Please read the moderators' question and correct the listing or contact us.`,
    promotionDecisionTitle: "Your promotion request was reviewed",
    promotionDecision: (title: string, approved: boolean, days: number, note: string | null) => approved
      ? `«${title}» will be promoted in listings for ${days} days.`
      : `The promotion request for «${title}» was declined${note ? `: ${note}` : "."}`,
    vipDecisionTitle: "Your VIP request was reviewed",
    vipDecision: (title: string, approved: boolean, days: number, note: string | null) => approved
      ? `«${title}» received VIP status for ${days} days.`
      : `The VIP request for «${title}» was declined${note ? `: ${note}` : "."}`,
    vipRevokedTitle: "VIP status ended",
    vipRevoked: (title: string, note: string | null) => `VIP status for «${title}» was ended${note ? `: ${note}` : "."}`,
    restrictionTitle: (lifted: boolean) => lifted ? "Account restriction lifted" : "A restriction was applied to your account",
    restriction: (kind: string, reason: string, lifted: boolean) => lifted ? `The «${kind}» restriction was lifted: ${reason}` : `Measure: «${kind}». Reason: ${reason}. You can appeal in “Restrictions” in your account.`,
    restrictionKinds: { WARNING: "Warning", EXTRA_VERIFICATION: "Extra verification", POSTING_LIMIT: "Posting limit", MODERATION_REVIEW: "Moderator review", TEMP_SUSPENSION: "Temporary restriction", BLOCK: "Block" } as Record<string, string>,
    newReviewTitle: "You received a new review",
    newReview: (target: string, rating: number) => `A new ${rating}-star review about «${target}» was published.`,
    subscriptionTitle: "Subscription status changed",
    subscription: (plan: string, active: boolean, until: string) => active ? `Your ${plan} subscription is active (until ${until}).` : `Your ${plan} subscription was stopped.`,
    securityPasswordTitle: "Your password was changed",
    securityPassword: "Your account password was changed and sessions on other devices were signed out. If this was not you, contact us immediately.",
    securityLoginTitle: "New sign-in to your account",
    securityLogin: (device: string, ip: string, at: string) => `Your account was signed in from an unrecognised device on ${at} (${device}, IP ${ip}). If this was not you, change your password immediately and sign out other sessions in your profile.`,
    reviewReportTitle: "Your review report was reviewed",
    reviewReport: (target: string, hidden: boolean) => hidden
      ? `Your report about a review of “${target}” was upheld: the review was hidden and removed from the rating.`
      : `The review of “${target}” was checked: it does not break the rules and stays on the site.`,
    reportOutcomeTitle: "Your report was reviewed",
    reportOutcome: (title: string, outcome: ReportOutcome) => outcome === "confirmed"
      ? `Your report about the listing “${title}” was confirmed and action was taken. Thank you.`
      : outcome === "dismissed"
        ? `Your report about the listing “${title}” was reviewed, but no violation was confirmed.`
        : `Your report about the listing “${title}” was closed — the listing is no longer relevant.`,
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
    leadReminderTitle: "Заявка ждёт ответа",
    leadReminder: (name: string, duration: string) => `На заявку клиента ${name} нет ответа уже ${duration} Свяжитесь с клиентом и отметьте это в карточке заявки.`,
    leadEscalationTitle: "Заявка остаётся без ответа",
    leadEscalation: (name: string, handler: string, duration: string) => `На заявку клиента ${name} нет ответа уже ${duration} (ответственный: ${handler}). Передайте её другому агенту или свяжитесь с клиентом сами.`,
    leadReassignTitle: "Передайте заявку другому агенту",
    leadReassign: (name: string, handler: string, duration: string) => `На заявку клиента ${name} нет ответа уже ${duration} (ответственный: ${handler}). Рекомендуем передать её другому агенту.`,
    duration: (minutes: number) => minutes < 120 ? `${minutes} мин.` : `${Math.round(minutes / 60)} ч.`,
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
    appealAcceptedTitle: "Ваша апелляция принята",
    appealAccepted: (title: string) => `Ваша апелляция по объявлению «${title}» принята, решение модерации отменено.`,
    appealRejectedTitle: "Ваша апелляция отклонена",
    appealRejected: (title: string) => `Ваша апелляция по объявлению «${title}» отклонена после независимой проверки. Вы можете исправить объявление и отправить его снова.`,
    transferRequestedTitle: "Запрос на передачу вашего объявления",
    transferRequested: (title: string, agency: string) => `Агентство «${agency}» хочет передать себе объявление «${title}». Рассмотрите запрос в разделе «Передачи».`,
    transferSourceApprovedTitle: "Агентство одобрило запрос на передачу",
    transferSourceApproved: (title: string) => `Агентство объявления одобрило передачу «${title}». Окончательное решение примет администратор платформы.`,
    transferRejectedTitle: "Запрос на передачу отклонён",
    transferRejected: (title: string) => `Запрос на передачу объявления «${title}» отклонён.`,
    memberAccessTitle: "Ваши права в агентстве изменены",
    memberAccess: (agency: string) => `Ваша роль или права в агентстве «${agency}» обновлены. Изменения уже действуют в кабинете.`,
    memberSuspendedTitle: "Доступ к агентству приостановлен",
    memberSuspended: (agency: string) => `Агентство «${agency}» приостановило ваш доступ к своим объявлениям и заявкам. Личный аккаунт и личные объявления не затронуты.`,
    memberResumedTitle: "Доступ к агентству восстановлен",
    memberResumed: (agency: string) => `Агентство «${agency}» восстановило ваш доступ к своим объявлениям и заявкам.`,
    listingAssignedTitle: "Вам назначено объявление",
    listingAssigned: (title: string, agency: string) => `Агентство «${agency}» назначило вам объявление «${title}». Оно в разделе «Мои объявления».`,
    taskAssignedTitle: "Вам поставлена новая задача",
    taskAssigned: (title: string, agency: string) => `В агентстве «${agency}» вам поставлена задача «${title}». Задачи — в кабинете.`,
    taskCompletedTitle: "Задача выполнена",
    taskCompleted: (title: string, name: string) => `${name} выполнил(а) задачу «${title}».`,
    transferCompletedTitle: "Объявление передано вашему агентству",
    transferCompleted: (title: string) => `Объявление «${title}» передано вашему агентству и находится в разделе «Мои объявления». Заявки прежнего агентства не передаются.`,
    transferMovedTitle: "Объявление передано другому агентству",
    transferMoved: (title: string, agency: string) => `Объявление «${title}» по одобренному запросу передано агентству «${agency}». Прежние заявки остаются у вас.`,
    listingRejectedTitle: "Ваше объявление отклонено",
    listingRejected: (title: string) => `Объявление «${title}» не прошло модерацию. Ознакомьтесь с причиной, исправьте объявление и отправьте его снова.`,
    listingNeedsInfoTitle: "Объявление требует исправлений",
    listingNeedsInfo: (title: string) => `Модератор просит исправить объявление «${title}» перед публикацией. Отредактируйте и сохраните его — оно снова попадёт на проверку.`,
    listingInfoRequestedTitle: "По вашему объявлению запрошены пояснения",
    listingInfoRequested: (title: string) => `Проверяется жалоба посетителя на объявление «${title}». Прочитайте вопрос модераторов и исправьте объявление или свяжитесь с нами.`,
    promotionDecisionTitle: "Ваш запрос на поднятие рассмотрен",
    promotionDecision: (title: string, approved: boolean, days: number, note: string | null) => approved
      ? `Объявление «${title}» будет поднято в списках на ${days} дн.`
      : `Запрос на поднятие «${title}» отклонён${note ? `: ${note}` : "."}`,
    vipDecisionTitle: "Ваш VIP-запрос рассмотрен",
    vipDecision: (title: string, approved: boolean, days: number, note: string | null) => approved
      ? `Объявление «${title}» получило VIP-статус на ${days} дн.`
      : `VIP-запрос для «${title}» отклонён${note ? `: ${note}` : "."}`,
    vipRevokedTitle: "VIP-статус прекращён",
    vipRevoked: (title: string, note: string | null) => `VIP-статус объявления «${title}» прекращён${note ? `: ${note}` : "."}`,
    restrictionTitle: (lifted: boolean) => lifted ? "Ограничение аккаунта снято" : "К аккаунту применено ограничение",
    restriction: (kind: string, reason: string, lifted: boolean) => lifted ? `Ограничение «${kind}» снято: ${reason}` : `Мера: «${kind}». Причина: ${reason}. Обжаловать можно в разделе «Ограничения» кабинета.`,
    restrictionKinds: { WARNING: "Предупреждение", EXTRA_VERIFICATION: "Доп. подтверждение", POSTING_LIMIT: "Лимит размещений", MODERATION_REVIEW: "Проверка модератором", TEMP_SUSPENSION: "Временное ограничение", BLOCK: "Блокировка" } as Record<string, string>,
    newReviewTitle: "Вам оставили новый отзыв",
    newReview: (target: string, rating: number) => `Опубликован новый отзыв о «${target}» с оценкой ${rating}.`,
    subscriptionTitle: "Статус подписки изменился",
    subscription: (plan: string, active: boolean, until: string) => active ? `Подписка ${plan} активна (до ${until}).` : `Подписка ${plan} остановлена.`,
    securityPasswordTitle: "Пароль изменён",
    securityPassword: "Пароль аккаунта изменён, сессии на других устройствах завершены. Если это были не вы, срочно свяжитесь с нами.",
    securityLoginTitle: "Вход в аккаунт с нового устройства",
    securityLogin: (device: string, ip: string, at: string) => `${at} в ваш аккаунт выполнен вход с незнакомого устройства (${device}, IP ${ip}). Если это были не вы, срочно смените пароль и завершите другие сессии в профиле.`,
    reviewReportTitle: "Ваша жалоба на отзыв рассмотрена",
    reviewReport: (target: string, hidden: boolean) => hidden
      ? `Ваша жалоба на отзыв о «${target}» подтверждена: отзыв скрыт и исключён из рейтинга.`
      : `Отзыв о «${target}» проверен: он не нарушает правила и остаётся на сайте.`,
    reportOutcomeTitle: "Ваша жалоба рассмотрена",
    reportOutcome: (title: string, outcome: ReportOutcome) => outcome === "confirmed"
      ? `Ваша жалоба на объявление «${title}» подтверждена, меры приняты. Спасибо.`
      : outcome === "dismissed"
        ? `Ваша жалоба на объявление «${title}» проверена, но нарушение не подтвердилось.`
        : `Ваша жалоба на объявление «${title}» закрыта — объявление больше не актуально.`,
    open: "Открыть в кабинете",
  },
} as const;

type NoticeCopy = (typeof COPY)[Locale];

/**
 * Hesab bildirişi (kabinet + e-poçt). Heç vaxt atmır; `true` — kabinet bildirişi yazılıb
 * (və ya eyni `dedupeKey` ilə artıq var) və ya alıcı aktiv deyil (çatdırılacaq yer yoxdur).
 * `false` — keçici xəta: çağıran təkrar cəhd üçün öz markerini geri qaytara bilər (#161).
 * E-poçt ən yaxşı cəhddir və nəticəyə təsir etmir.
 */
async function notifyAccount(
  userId: string,
  type: NotificationType,
  path: string,
  dedupeKey: string,
  build: (copy: NoticeCopy) => { title: string; content: string },
): Promise<boolean> {
  try {
    const [user, preference] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { email: true, locale: true, isActive: true } }),
      prisma.notificationPreference.findUnique({ where: { userId }, select: { categoryChannels: true } }),
    ]);
    if (!user?.isActive) return true;
    // İstifadəçinin kateqoriya × kanal seçimi (#252, PRD 17.4); təhlükəsizlik bildirişi həmişə gedir.
    const channels = channelsForType(type, parseCategoryChannels(preference?.categoryChannels));
    const locale = localeOf(user.locale);
    const copy = COPY[locale];
    const { title, content } = build(copy);
    if (channels.inApp) {
      let stored = true;
      await prisma.notification.create({
        data: { userId, type, title, content, actionUrl: path, dedupeKey },
      }).catch((error: unknown) => {
        // Eyni açarla bildiriş artıq var — təkrar cəhd sayılır, çatdırılıb.
        stored = isUniqueViolation(error);
      });
      if (!stored) return false;
    }
    // Saytdaxili kanal söndürülübsə e-poçtun təkrarını `dedupeKey` qoruya bilmir — e-poçt yalnız seçilibsə gedir.
    if (!channels.email) return true;
    const url = siteUrl(localizePath(path, locale));
    // E-poçt bildirişləri söndürülübsə (#242) `sendEmail` buraxır; kabinet bildirişi yenə yazılır.
    await sendEmail({
      notification: true,
      to: user.email,
      subject: title,
      html: `<p>${escapeHtml(content)}</p><p><a href="${emailHref(url)}">${copy.open}</a></p>`,
    }).catch((error: unknown) => console.error("[notice] e-poçt göndərilmədi:", error));
    return true;
  } catch (error) {
    console.error("[notice] hesab bildirişi göndərilmədi:", error);
    return false;
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

/**
 * Cavabsız müraciət pilləsi (#161, #224): `reminder` — məsul şəxsə, `alert` — sahib/menecerə,
 * `reassign` — təkrar təyinat təklifi. Keçid müraciət kartınadır. `false` — bildiriş yazılmadı,
 * pillə növbəti cron-da təkrarlanmalıdır; açar pillə + müraciət + alıcıdır, təkrar ikiqat yazmır.
 */
export async function noticeUnansweredLead(input: {
  userId: string;
  step: "reminder" | "alert" | "reassign";
  leadId: string;
  visitorName: string;
  handlerName: string;
  minutes: number;
}): Promise<boolean> {
  return notifyAccount(
    input.userId,
    NOTIFICATION_TYPES.LEAD_ESCALATION,
    `/kabinet/muracietler/${input.leadId}`,
    `lead-${input.step}:${input.leadId}:${input.userId}`,
    (copy) => {
      const duration = copy.duration(input.minutes);
      if (input.step === "reminder") return { title: copy.leadReminderTitle, content: copy.leadReminder(input.visitorName, duration) };
      if (input.step === "reassign") return { title: copy.leadReassignTitle, content: copy.leadReassign(input.visitorName, input.handlerName, duration) };
      return { title: copy.leadEscalationTitle, content: copy.leadEscalation(input.visitorName, input.handlerName, duration) };
    },
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

/**
 * Elan sahibinə: moderasiya qərarı (#202) — rədd edildi və ya düzəliş tələb olunur, moderatorun
 * səbəbi ilə. Əvvəllər rədd sahibə heç bildirilmirdi və elan səssizcə qaralamaya düşürdü.
 */
export async function noticeListingModeration(input: {
  userId: string;
  propertyId: string;
  propertyTitle: string;
  decision: "rejected" | "needs_info";
  decidedAt: Date;
  reason?: string | null;
}): Promise<boolean> {
  // `false` — bildiriş yazılmadı: çağıran qərarı geri alır ki, sahib səbəbsiz gizlənmiş elanla qalmasın.
  return notifyAccount(
    input.userId,
    NOTIFICATION_TYPES.LISTING_MODERATION,
    "/kabinet/elanlar",
    `listing-moderation:${input.propertyId}:${attemptKey(input.decidedAt)}:${input.decision}`,
    (copy) => input.decision === "rejected"
      ? { title: copy.listingRejectedTitle, content: withReason(copy.listingRejected(input.propertyTitle), copy, input.reason) }
      : { title: copy.listingNeedsInfoTitle, content: withReason(copy.listingNeedsInfo(input.propertyTitle), copy, input.reason) },
  );
}

/** Elan sahibinə: etirazın nəticəsi (#206) — müstəqil yoxlayanın qeydi ilə. */
export async function noticeAppealDecision(input: {
  userId: string;
  propertyId: string;
  propertyTitle: string;
  accepted: boolean;
  decidedAt: Date;
  note?: string | null;
}): Promise<boolean> {
  return notifyAccount(
    input.userId,
    NOTIFICATION_TYPES.LISTING_MODERATION,
    "/kabinet/elanlar",
    `listing-appeal:${input.propertyId}:${attemptKey(input.decidedAt)}`,
    (copy) => input.accepted
      ? { title: copy.appealAcceptedTitle, content: withReason(copy.appealAccepted(input.propertyTitle), copy, input.note) }
      : { title: copy.appealRejectedTitle, content: withReason(copy.appealRejected(input.propertyTitle), copy, input.note) },
  );
}

/** Elan sahibinə: şikayət üzrə moderator izahat istəyir (#195) — sual mətni ilə. */
export async function noticeListingInfoRequested(input: {
  userId: string;
  propertyId: string;
  propertyTitle: string;
  requestedAt: Date;
  note: string;
}): Promise<boolean> {
  // `false` — bildiriş yazılmadı: çağıran statusu geri qaytarır, yoxsa növbə sahibin heç vaxt
  // görmədiyi suala cavab gözləyərdi.
  return notifyAccount(
    input.userId,
    NOTIFICATION_TYPES.LISTING_REPORT,
    "/kabinet/elanlar",
    `listing-report-info:${input.propertyId}:${attemptKey(input.requestedAt)}`,
    (copy) => ({
      title: copy.listingInfoRequestedTitle,
      content: withReason(copy.listingInfoRequested(input.propertyTitle), copy, input.note),
    }),
  );
}

/**
 * Daxil olmuş şikayətçiyə: şikayətin nəticəsi (#195). Elan sahibinin kimliyi və moderatorun
 * daxili qeydi göndərilmir — yalnız nəticə.
 */
export async function noticeReportOutcome(input: {
  userId: string;
  propertyId: string;
  propertyTitle: string;
  decidedAt: Date;
  outcome: ReportOutcome;
}): Promise<void> {
  await notifyAccount(
    input.userId,
    NOTIFICATION_TYPES.LISTING_REPORT,
    "/kabinet/sikayetlerim",
    // `dedupeKey` qlobal unikaldır: eyni qərar bir neçə şikayətçiyə gedir, açar alıcını daşımalıdır.
    `report-outcome:${input.propertyId}:${attemptKey(input.decidedAt)}:${input.userId}`,
    (copy) => ({ title: copy.reportOutcomeTitle, content: copy.reportOutcome(input.propertyTitle, input.outcome) }),
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

/** A agentliyinin sahibinə: B agentliyi elanını köçürmək istəyir (#212). */
export async function noticeTransferRequested(input: {
  userId: string;
  transferId: string;
  propertyTitle: string;
  toAgencyName: string;
}): Promise<boolean> {
  return notifyAccount(
    input.userId,
    NOTIFICATION_TYPES.LISTING_TRANSFER,
    "/kabinet/kocurmeler",
    `listing-transfer:${input.transferId}:requested`,
    (copy) => ({ title: copy.transferRequestedTitle, content: copy.transferRequested(input.propertyTitle, input.toAgencyName) }),
  );
}

export type TransferNoticeStage = "sourceApproved" | "rejected" | "completed" | "moved";

/** Köçürmə qərarı (#212): sorğunu yaradana/təhvil alana və elanın köhnə agentliyinə. */
export async function noticeTransferDecision(input: {
  userId: string;
  transferId: string;
  stage: TransferNoticeStage;
  propertyTitle: string;
  /** `moved` üçün yeni agentliyin adı. */
  agencyName?: string;
  note?: string | null;
}): Promise<boolean> {
  return notifyAccount(
    input.userId,
    NOTIFICATION_TYPES.LISTING_TRANSFER,
    input.stage === "completed" ? "/kabinet/elanlar" : "/kabinet/kocurmeler",
    `listing-transfer:${input.transferId}:${input.stage}:${input.userId}`,
    (copy) => {
      if (input.stage === "sourceApproved") return { title: copy.transferSourceApprovedTitle, content: copy.transferSourceApproved(input.propertyTitle) };
      if (input.stage === "completed") return { title: copy.transferCompletedTitle, content: copy.transferCompleted(input.propertyTitle) };
      if (input.stage === "moved") return { title: copy.transferMovedTitle, content: copy.transferMoved(input.propertyTitle, input.agencyName ?? "") };
      return { title: copy.transferRejectedTitle, content: withReason(copy.transferRejected(input.propertyTitle), copy, input.note) };
    },
  );
}

export type MemberAccessStage = "access" | "suspended" | "resumed";

/** Agentə: sahib rolunu/səlahiyyətini dəyişdi, girişini dayandırdı və ya bərpa etdi (#218). */
export async function noticeMemberAccess(input: {
  userId: string;
  employeeId: string;
  stage: MemberAccessStage;
  agencyName: string;
  at: Date;
  reason?: string | null;
}): Promise<boolean> {
  return notifyAccount(
    input.userId,
    NOTIFICATION_TYPES.AGENCY_TEAM,
    input.stage === "suspended" ? "/kabinet/profil" : "/kabinet",
    `member-${input.stage}:${input.employeeId}:${attemptKey(input.at)}`,
    (copy) => {
      if (input.stage === "suspended") return { title: copy.memberSuspendedTitle, content: withReason(copy.memberSuspended(input.agencyName), copy, input.reason) };
      if (input.stage === "resumed") return { title: copy.memberResumedTitle, content: copy.memberResumed(input.agencyName) };
      return { title: copy.memberAccessTitle, content: copy.memberAccess(input.agencyName) };
    },
  );
}

/** Agentə: agentlik elanı ona təyin edildi (#218, PRD 7.2). */
export async function noticeListingAssigned(input: {
  userId: string;
  propertyId: string;
  propertyTitle: string;
  agencyName: string;
  at: Date;
}): Promise<boolean> {
  return notifyAccount(
    input.userId,
    NOTIFICATION_TYPES.AGENCY_TEAM,
    "/kabinet/elanlar",
    `listing-assigned:${input.propertyId}:${input.userId}:${attemptKey(input.at)}`,
    (copy) => ({ title: copy.listingAssignedTitle, content: copy.listingAssigned(input.propertyTitle, input.agencyName) }),
  );
}

/** Agentlik tapşırığı (#220): icraçıya təyinat, yaradana tamamlanma. */
export async function noticeAgencyTask(input: {
  userId: string;
  taskId: string;
  stage: "assigned" | "completed";
  taskTitle: string;
  agencyName: string;
  actorName: string;
}): Promise<boolean> {
  return notifyAccount(
    input.userId,
    NOTIFICATION_TYPES.AGENCY_TASK,
    "/kabinet/tapsiriqlar",
    `agency-task:${input.taskId}:${input.stage}`,
    (copy) => input.stage === "assigned"
      ? { title: copy.taskAssignedTitle, content: copy.taskAssigned(input.taskTitle, input.agencyName) }
      : { title: copy.taskCompletedTitle, content: copy.taskCompleted(input.taskTitle, input.actorName) },
  );
}

/** Rəydən şikayət edənə: moderator qərarı (#232). Açar alıcını daşıyır — qərar bir neçə şikayətçiyə gedir. */
export async function noticeReviewReportOutcome(input: {
  userId: string;
  reviewId: string;
  targetName: string;
  hidden: boolean;
}): Promise<void> {
  await notifyAccount(
    input.userId,
    NOTIFICATION_TYPES.REVIEW_REPORT,
    "/kabinet/bildirisler",
    `review-report:${input.reviewId}:${input.userId}`,
    (copy) => ({ title: copy.reviewReportTitle, content: copy.reviewReport(input.targetName, input.hidden) }),
  );
}

/** Elan sahibinə: VIP sorğusunun qərarı (#248). Açar qərarı daşıyır — rədd edilib yenidən göndərilən sorğu ayrıca bildirilir. */
export async function noticeVipDecision(input: { userId: string; requestId: string; title: string; approved: boolean; days: number; note: string | null }): Promise<void> {
  await notifyAccount(
    input.userId,
    NOTIFICATION_TYPES.VIP,
    "/kabinet/elanlar",
    `vip:${input.requestId}:${input.approved ? "approved" : "rejected"}`,
    (copy) => ({ title: copy.vipDecisionTitle, content: copy.vipDecision(input.title, input.approved, input.days, input.note) }),
  );
}

/** Elan sahibinə: admin VIP dövrünü vaxtından əvvəl dayandırdı (#248). */
export async function noticeVipRevoked(input: { userId: string; requestId: string; title: string; note: string | null }): Promise<void> {
  await notifyAccount(
    input.userId,
    NOTIFICATION_TYPES.VIP,
    "/kabinet/elanlar",
    `vip:${input.requestId}:revoked`,
    (copy) => ({ title: copy.vipRevokedTitle, content: copy.vipRevoked(input.title, input.note) }),
  );
}

/** Elan sahibinə: irəli çəkmə sorğusunun qərarı (#250). */
export async function noticePromotionDecision(input: { userId: string; campaignId: string; title: string; approved: boolean; days: number; note: string | null }): Promise<void> {
  await notifyAccount(
    input.userId,
    NOTIFICATION_TYPES.PROMOTION,
    "/kabinet/elanlar",
    `promotion:${input.campaignId}:${input.approved ? "approved" : "rejected"}`,
    (copy) => ({ title: copy.promotionDecisionTitle, content: copy.promotionDecision(input.title, input.approved, input.days, input.note) }),
  );
}

/** Agentə və ya agentlik sahibinə: rəyi təsdiqləndi və dərc olundu (#252, PRD 17.3 «Yeni rəy»). */
export async function noticeNewReview(input: { userId: string; reviewId: string; targetName: string; rating: number }): Promise<void> {
  await notifyAccount(
    input.userId,
    NOTIFICATION_TYPES.REVIEW,
    "/kabinet/reyler",
    `review:${input.reviewId}`,
    (copy) => ({ title: copy.newReviewTitle, content: copy.newReview(input.targetName, input.rating) }),
  );
}

/** Abunəçiyə: abunə təyin edildi və ya dayandırıldı (#252, PRD 17.3 «Abunə statusu»). */
export async function noticeSubscriptionStatus(input: { userId: string; subscriptionId: string; plan: string; active: boolean; until: string }): Promise<void> {
  await notifyAccount(
    input.userId,
    NOTIFICATION_TYPES.SUBSCRIPTION,
    "/paketler",
    `subscription:${input.subscriptionId}:${input.active ? "active" : "stopped"}`,
    (copy) => ({ title: copy.subscriptionTitle, content: copy.subscription(input.plan, input.active, input.until) }),
  );
}

/** Kritik təhlükəsizlik xəbərdarlığı (#252): parol dəyişdi — istifadəçi bu bildirişi söndürə bilmir. */
export async function noticePasswordChanged(input: { userId: string; changedAt: Date }): Promise<void> {
  await notifyAccount(
    input.userId,
    NOTIFICATION_TYPES.SECURITY,
    "/kabinet/profil",
    `security:password:${input.userId}:${input.changedAt.getTime()}`,
    (copy) => ({ title: copy.securityPasswordTitle, content: copy.securityPassword }),
  );
}

/** Kritik təhlükəsizlik xəbərdarlığı (#264, PRD 23.1): tanınmayan cihazdan giriş — istifadəçi söndürə bilmir. */
export async function noticeNewDeviceLogin(input: { userId: string; sessionId: string; device: string; ip: string; at: string }): Promise<void> {
  await notifyAccount(
    input.userId,
    NOTIFICATION_TYPES.SECURITY,
    "/kabinet/profil",
    `security:login:${input.sessionId}`,
    (copy) => ({ title: copy.securityLoginTitle, content: copy.securityLogin(input.device, input.ip, input.at) }),
  );
}

/** Hesaba tədbir tətbiq olundu və ya götürüldü (#258) — təhlükəsizlik kateqoriyası, söndürülmür. */
export async function noticeAccountRestriction(input: { userId: string; restrictionId: string; kind: string; reason: string; lifted: boolean }): Promise<void> {
  await notifyAccount(
    input.userId,
    NOTIFICATION_TYPES.ACCOUNT_RESTRICTION,
    "/kabinet/mehdudiyyetler",
    `restriction:${input.restrictionId}:${input.lifted ? "lifted" : "applied"}`,
    (copy) => ({ title: copy.restrictionTitle(input.lifted), content: copy.restriction(copy.restrictionKinds[input.kind] ?? input.kind, input.reason, input.lifted) }),
  );
}
