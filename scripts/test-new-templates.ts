import { sendLeadNotificationEmail, sendShowcaseEmail } from "../src/lib/email";

async function test() {
  console.log("1. Yeni lüks müraciət şablonu test edilir...");
  const res1 = await sendLeadNotificationEmail({
    name: "Cavid Qasımov",
    phone: "+994 50 777 88 99",
    email: "cavid@example.com",
    subject: "Port Baku Rezidensdə lüks mənzil",
    message:
      "Salam. Port Baku layihəsində 3 otaqlı təmirli mənzillərlə maraqlanıram. Təcili baxış təşkil etmək mümkündürmü?",
    propertyTitle: "Port Baku Luxury Residence",
  });
  console.log(
    "Müraciət testi nəticəsi:",
    res1.success
      ? `✓ UĞURLU (ID: ${res1.data?.id})`
      : `✗ XƏTA: ${res1.error}`
  );

  console.log("\n2. Yeni lüks əmlak bülleteni şablonu test edilir...");
  const res2 = await sendShowcaseEmail({
    to: "amiyevbahadur@gmail.com",
    subject: "Luxe Home Estate — Seçilmiş Premium Əmlaklar Kataloqu",
  });
  console.log(
    "Bülleten testi nəticəsi:",
    res2.success
      ? `✓ UĞURLU (ID: ${res2.data?.id})`
      : `✗ XƏTA: ${res2.error}`
  );
}

test().catch(console.error);
