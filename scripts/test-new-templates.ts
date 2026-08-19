import { sendLeadNotificationEmail } from "../src/lib/email";

async function test() {
  console.log("WhatsApp linkli yeni bildiriş şablonu test edilir...");
  const res = await sendLeadNotificationEmail({
    name: "Tural Məmmədli",
    phone: "+994 51 922 85 85",
    email: "tural@example.com",
    subject: "Mərdəkan villa layihəsi müraciəti",
    message:
      "Salam. WhatsApp inteqrasiyası testi aparılır. Düymə birbaşa +994 51 922 85 85 nömrəsinə mesaj göndərməlidir.",
    propertyTitle: "Mərdəkan Luxury Villa",
  });

  console.log(
    "Nəticə:",
    res.success
      ? `✓ UĞURLU (Email ID: ${res.data?.id})`
      : `✗ XƏTA: ${res.error}`
  );
}

test().catch(console.error);
