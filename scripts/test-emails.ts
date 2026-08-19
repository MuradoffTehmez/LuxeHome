import { sendLeadNotificationEmail } from "../src/lib/email";

const testLeads = [
  {
    name: "Rəşad Quliyev",
    phone: "+994 50 211 34 56",
    email: "reshad.quliyev@example.com",
    subject: "Ağ Şəhərdə 4 otaqlı premium mənzil satışı",
    message:
      "Salam. Ağ Şəhər layihəsində dəniz mənzərəli, təmirsiz və ya dizayn təmirli 4 otaqlı mənzil axtarıram. Büdcəmiz 450.000 AZN-ə qədərdir. Əlaqə saxlamağınızı xahiş edirəm.",
    propertyTitle: "Ağ Şəhər Premium Rezidens",
  },
  {
    name: "Nərmin Məmmədova",
    phone: "+994 55 832 19 00",
    email: "narmin.m@example.com",
    subject: "Bilgəhdə bağ evi icarəsi (Yay mövsümü)",
    message:
      "Hörmətli Luxe Home komandası, Bilgəh və ya Mərdəkan qəsəbəsində hovuzlu və geniş həyəti olan villa icarəyə götürmək istəyirik. 3 aylıq müqavilə üçün ən uyğun variantları təqdim edə bilərsinizmi?",
    propertyTitle: "Bilgəh Dənizkənarı Villa",
  },
  {
    name: "Elmir Həsənov",
    phone: "+994 70 514 88 99",
    email: "elmir.hasanov@holding.az",
    subject: "Nizami küçəsində kommersiya / ofis sahəsi",
    message:
      "Şirkətimiz üçün şəhərin mərkəzində 250-300 kv.m sahəsi olan A kateqoriyalı ofis sahəsi axtarırıq. Yeraltı parkinq və mühafizə mütləqdir. Ətraflı təkliflərinizi gözləyirik.",
    propertyTitle: "Nizami Plaza Ofislər",
  },
  {
    name: "Leyla Əliyeva",
    phone: "+994 50 333 77 11",
    email: "leyla.aliyeva@gmail.com",
    subject: "Dəniz Panoraması Villa layihəsi haqqında",
    message:
      "Salam. Saytınızdakı 'Dəniz Panoraması Villaları' layihəsi çox diqqətimi çəkdi. Tikinti mərhələləri, çatdırılma tarixi və daxili kredit şərtləri barədə məlumat almaq üçün görüş təyin etmək istərdim.",
    propertyTitle: "Dəniz Panoraması Villaları",
  },
  {
    name: "Kamran İsmayılov",
    phone: "+994 77 400 90 20",
    email: "kamran.ismayil@mail.ru",
    subject: "Əmlakımın satışa çıxarılması (Mərdəkan)",
    message:
      "Mərdəkanda 12 sot torpaqda yerləşən 2 mərtəbəli monolit bağ evimi satışa çıxarmaq istəyirəm. Peşəkar qiymətləndirmə və çəkiliş xidmətinizdən yararlanmaq üçün əlaqə saxlayın zəhmət olmasa.",
    propertyTitle: "Mərdəkan Bağ Evi",
  },
];

async function run() {
  console.log("5 ədəd test e-poçtu göndərilir...\n");

  for (let i = 0; i < testLeads.length; i++) {
    const lead = testLeads[i];
    console.log(`[${i + 1}/5] Göndərilir: ${lead.name} — ${lead.subject}`);
    const res = await sendLeadNotificationEmail(lead);
    console.log(
      `      Nəticə: ${
        res.success
          ? `✓ UĞURLU (Email ID: ${res.data?.id})`
          : `✗ XƏTA: ${res.error}`
      }`
    );

    if (i < testLeads.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log("\n✅ Bütün 5 test e-poçtu uğurla göndərildi!");
}

run().catch(console.error);
