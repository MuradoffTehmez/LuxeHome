import type { Metadata } from "next";
import {
  Building2,
  FlaskConical,
  Handshake,
  Info,
  Landmark,
  Newspaper,
  UserRound,
  Users,
} from "lucide-react";
import { AdminCard, AdminPageHeader, StatCard } from "@/components/admin/admin-ui";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminT } from "@/lib/admin-i18n";
import { getDemoContentStats, isDemoContentEnabled } from "@/lib/demo-content";
import { DemoToggleForm } from "./demo-toggle-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.demoContent.title") };
}

export const dynamic = "force-dynamic";

export default async function AdminDemoContentPage() {
  const t = await getAdminT();
  await requireAdminRead(PERMISSIONS.SETTINGS_MANAGE);

  const [enabled, stats] = await Promise.all([isDemoContentEnabled(), getDemoContentStats()]);

  const total =
    stats.properties + stats.projects + stats.agencies + stats.agents + stats.partners + stats.posts;

  return (
    <>
      <AdminPageHeader
        title={t("pages.demoContent.title")}
        description={t("pages.demoContent.description")}
        breadcrumbs={[
          { label: t("pages.settings.idarePaneli"), href: "/admin" },
          { label: t("pages.demoContent.title") },
        ]}
      />

      <div className="flex min-w-0 flex-col gap-6">
        <AdminCard
          title={t("pages.demoContent.toggleTitle")}
          description={t("pages.demoContent.toggleDescription")}
        >
          <DemoToggleForm enabled={enabled} hasContent={total > 0} />
        </AdminCard>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label={t("pages.demoContent.statProperties")}
            value={stats.properties}
            hint={t("pages.demoContent.statPropertiesHint", { p0: stats.byCategory.length })}
            icon={Building2}
            tone="gold"
          />
          <StatCard
            label={t("pages.demoContent.statProjects")}
            value={stats.projects}
            icon={Landmark}
            tone="neutral"
          />
          <StatCard
            label={t("pages.demoContent.statAgencies")}
            value={stats.agencies}
            icon={Users}
            tone="neutral"
          />
          <StatCard
            label={t("pages.demoContent.statAgents")}
            value={stats.agents}
            icon={UserRound}
            tone="neutral"
          />
          <StatCard
            label={t("pages.demoContent.statPartners")}
            value={stats.partners}
            icon={Handshake}
            tone="neutral"
          />
          <StatCard
            label={t("pages.demoContent.statPosts")}
            value={stats.posts}
            icon={Newspaper}
            tone="neutral"
          />
        </div>

        <div className="grid min-w-0 gap-6 xl:grid-cols-[1.2fr_1fr]">
          <AdminCard
            title={t("pages.demoContent.byCategoryTitle")}
            description={t("pages.demoContent.byCategoryDescription")}
            bodyClassName="p-0"
          >
            <ul className="divide-y divide-line">
              {stats.byCategory.map((category) => (
                <li
                  key={category.slug}
                  className="flex items-center justify-between gap-4 px-5 py-2.5 text-sm"
                >
                  <span className="min-w-0 truncate text-ink">{category.name}</span>
                  <span
                    className={`tabular shrink-0 font-semibold ${
                      category.count > 0 ? "text-ink" : "text-ink-muted"
                    }`}
                  >
                    {category.count}
                  </span>
                </li>
              ))}
            </ul>
          </AdminCard>

          <AdminCard title={t("pages.demoContent.howTitle")}>
            <div className="flex min-w-0 flex-col gap-4 text-sm text-ink-soft">
              <p className="flex items-start gap-2.5">
                <Info className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                <span>{t("pages.demoContent.howVisibility")}</span>
              </p>
              <p className="flex items-start gap-2.5">
                <FlaskConical className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                <span>{t("pages.demoContent.howSeo")}</span>
              </p>

              <div className="flex flex-col gap-2">
                <p className="font-medium text-ink">{t("pages.demoContent.howCommands")}</p>
                <ul className="flex flex-col gap-1.5">
                  {[
                    ["npm run db:demo:build", t("pages.demoContent.cmdBuild")],
                    ["npm run db:demo:local", t("pages.demoContent.cmdLoad")],
                    ["npm run db:clean-demo:local", t("pages.demoContent.cmdClean")],
                  ].map(([command, hint]) => (
                    <li key={command} className="min-w-0">
                      <code className="block overflow-x-auto rounded-xs bg-beige px-2 py-1 font-mono text-xs text-ink">
                        {command}
                      </code>
                      <span className="text-xs text-ink-muted">{hint}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </AdminCard>
        </div>
      </div>
    </>
  );
}
