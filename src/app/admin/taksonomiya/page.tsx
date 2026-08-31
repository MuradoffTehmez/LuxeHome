import type { Metadata } from "next";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { FormJumpNav } from "@/components/admin/form-shell";
import { PERMISSIONS, type FeatureGroup } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminTaxonomy } from "@/lib/queries";
import { getAdminT } from "@/lib/admin-i18n";
import {
  CreateFeatureForm,
  CreatePropertyTypeForm,
  FeatureRow,
  PropertyTypeRow,
} from "./taxonomy-forms";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.taxonomy.taksonomiya") };
}
export const dynamic = "force-dynamic";

/** Bölmə adları dilə bağlıdır, ona görə modul sabiti kimi saxlanmır. */
const taxonomySections = (t: Awaited<ReturnType<typeof getAdminT>>) =>
  [
    { id: "emlak-novleri", label: t("pages.taxonomy.emlakNovleri") },
    { id: "yeni-emlak-novu", label: t("pages.taxonomy.yeniNov") },
    { id: "xususiyyetler", label: t("pages.taxonomy.xususiyyetler") },
    { id: "yeni-xususiyyet", label: t("pages.taxonomy.yeniXususiyyet") },
  ] as const;

export default async function AdminTaxonomyPage() {
  const t = await getAdminT();
  await requireAdminRead(PERMISSIONS.PROPERTY_MANAGE);
  const { types, features } = await getAdminTaxonomy();

  const featuresByGroup = new Map<string, typeof features>();
  for (const feature of features) {
    const bucket = featuresByGroup.get(feature.group) ?? [];
    bucket.push(feature);
    featuresByGroup.set(feature.group, bucket);
  }

  return (
    <>
      <AdminPageHeader
        title={t("pages.taxonomy.taksonomiya")}
        description={t("pages.taxonomy.emlakNovleriVeXususiyyetler")}
        breadcrumbs={[{ label: t("pages.taxonomy.idarePaneli"), href: "/admin" }, { label: t("pages.taxonomy.taksonomiya") }]}
      />

      <FormJumpNav items={taxonomySections(t)} />

      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-6">
          <section id="emlak-novleri" className="scroll-mt-32">
            <AdminCard title={t("pages.taxonomy.emlakNovleri")} description={`${types.length} növ`} bodyClassName="p-0">
              <ul>
                {types.map((type) => (
                  <PropertyTypeRow
                    key={type.id}
                    id={type.id}
                    name={type.name}
                    isActive={type.isActive}
                    propertyCount={type._count.properties}
                  />
                ))}
              </ul>
            </AdminCard>
          </section>
          <section id="yeni-emlak-novu" className="scroll-mt-32"><CreatePropertyTypeForm /></section>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <section id="xususiyyetler" className="scroll-mt-32">
            <AdminCard title={t("pages.taxonomy.xususiyyetler")} description={`${features.length} xüsusiyyət`} bodyClassName="p-0">
              <div className="flex flex-col">
                {Array.from(featuresByGroup.entries()).map(([group, items]) => (
                  <div key={group} className="border-b border-line last:border-0">
                    <p className="px-4 py-2 text-xs font-medium tracking-wide text-ink-muted uppercase">
                      {t(`labels.featureGroup.${group as FeatureGroup}`) ?? group}
                    </p>
                    <ul>
                      {items.map((feature) => (
                        <FeatureRow
                          key={feature.id}
                          id={feature.id}
                          name={feature.name}
                          propertyCount={feature._count.properties}
                        />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </AdminCard>
          </section>
          <section id="yeni-xususiyyet" className="scroll-mt-32"><CreateFeatureForm /></section>
        </div>
      </div>
    </>
  );
}
