import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
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
      <div className="min-w-0">
        <PageHeader
          contained
          compact
          eyebrow="Kabinet / Elanlar"
          title="Yeni elan göndər"
          description="Məlumatları diqqətlə doldurun. Elanınız hesab növünüzə uyğun olaraq yoxlanacaq və ya dərhal dərc ediləcək."
        />
        <div className="mt-8">
        <PublicPropertyForm action={createPublicProperty} options={options} />
        </div>
      </div>
  );
}
