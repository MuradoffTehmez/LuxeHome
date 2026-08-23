import type { Metadata } from "next";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { PERMISSIONS, FEATURE_GROUP_LABELS, type FeatureGroup } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminTaxonomy } from "@/lib/queries";
import {
  CreateFeatureForm,
  CreatePropertyTypeForm,
  FeatureRow,
  PropertyTypeRow,
} from "./taxonomy-forms";

export const metadata: Metadata = { title: "Taksonomiya" };
export const dynamic = "force-dynamic";

export default async function AdminTaxonomyPage() {
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
        title="Taksonomiya"
        description="Əmlak növləri və xüsusiyyətlər — filtr panelində və elan formasında görünən kateqoriyalar. Şəhər/rayon siyahısı ayrıca idxal skripti ilə idarə olunur."
        breadcrumbs={[{ label: "İdarə paneli", href: "/admin" }, { label: "Taksonomiya" }]}
      />

      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-6">
          <AdminCard title="Əmlak növləri" description={`${types.length} növ`} bodyClassName="p-0">
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
          <CreatePropertyTypeForm />
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <AdminCard title="Xüsusiyyətlər" description={`${features.length} xüsusiyyət`} bodyClassName="p-0">
            <div className="flex flex-col">
              {Array.from(featuresByGroup.entries()).map(([group, items]) => (
                <div key={group} className="border-b border-line last:border-0">
                  <p className="px-4 py-2 text-xs font-medium tracking-wide text-ink-muted uppercase">
                    {FEATURE_GROUP_LABELS[group as FeatureGroup] ?? group}
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
          <CreateFeatureForm />
        </div>
      </div>
    </>
  );
}
