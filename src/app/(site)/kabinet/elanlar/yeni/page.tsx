import type { Metadata } from "next";
import { getPropertyFormOptions } from "@/lib/queries";
import { requireLister } from "@/lib/auth/guard";
import { buildMetadata } from "@/lib/seo";
import { createPublicProperty } from "./actions";
import { PublicPropertyForm } from "./public-property-form";

export const metadata: Metadata = buildMetadata({
  title: "Elan göndər",
  description: "Luxe Home Estate üçün yeni əmlak elanı göndərin.",
  path: "/kabinet/elanlar/yeni",
  noIndex: true,
});

export default async function NewPropertyPage() {
  await requireLister();
  const options = await getPropertyFormOptions();

  return (
      <>
        <header className="mb-8">
          <p className="text-sm font-medium text-gold-deep">Kabinet / Elanlar</p>
          <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Yeni elan göndər</h1>
          <p className="mt-3 max-w-2xl text-ink-soft">
            Məlumatları diqqətlə doldurun. Elanınız hesab növünüzə uyğun olaraq yoxlanacaq və ya
            dərhal dərc ediləcək.
          </p>
        </header>
        <PublicPropertyForm action={createPublicProperty} options={options} />
      </>
  );
}
