import type { AgencyAnalytics } from "@/lib/accounts/agency-analytics";
import type { getListingAnalytics } from "@/lib/accounts/listing-analytics";
import type { Sheet } from "@/lib/export/tabular";

/**
 * Analitika hesabatlarının cədvəlləri (#238, PRD 11.6). Mətnlər çağıranın dilindədir (`label`),
 * rəqəmlər rəqəm kimi qalır ki, Excel-də hesablana bilsin.
 */

type Label = (key: string, values?: Record<string, string | number>) => string;

export function agencyReportSheets(data: AgencyAnalytics, label: Label): Sheet[] {
  const totals = data.totals;
  return [
    {
      name: label("totalsTitle"),
      rows: [
        [label("rangeLabel"), `${data.range.fromDay} — ${data.range.toDay}`],
        ...(["totalListings", "activeListings", "sold", "rented", "views", "clicks", "leads", "newClients", "averageActiveDays"] as const)
          .map((key) => [label(`totals.${key}`), totals[key]]),
      ],
    },
    {
      name: label("agentsTitle"),
      rows: [
        ["name", "placed", "active", "leads", "responded", "response", "viewings", "deals", "reviews"].map((key) => label(`agents.${key}`)),
        ...data.agents.map((agent) => [
          agent.name, agent.placed, agent.active, agent.leads, agent.responded, agent.responseMinutes,
          agent.viewings, agent.deals, agent.reviewCount ? `${agent.reviewAverage} (${agent.reviewCount})` : null,
        ]),
      ],
    },
    {
      name: label("areasTitle"),
      rows: [
        ["name", "listings", "views", "leads"].map((key) => label(`areas.${key}`)),
        ...data.areas.map((area) => [area.name, area.listings, area.views, area.leads]),
      ],
    },
    {
      name: label("typesTitle"),
      rows: [[label("typesTitle"), label("totals.leads")], ...data.leadTypes.map((item) => [item.name, item.leads])],
    },
    {
      name: label("priceTitle"),
      rows: [
        [label("priceTitle"), label("export.min"), label("export.max"), label("totals.leads")],
        ...data.priceInterest.map((item) => [label(item.listingType === "RENT" ? "rent" : "sale"), item.from, item.to, item.leads]),
      ],
    },
    {
      name: label("dynamicsTitle"),
      rows: [[label("export.day"), label("totals.views"), label("totals.clicks"), label("totals.leads")], ...data.series.map((point) => [point.day, point.views, point.clicks, point.leads])],
    },
  ];
}

export function listingReportSheets(data: Awaited<ReturnType<typeof getListingAnalytics>>, label: Label): Sheet[] {
  const keys = ["views", "uniqueViews", "contactReveals", "whatsappClicks", "telegramClicks", "leads", "favorites", "priceChanges"] as const;
  return [
    {
      name: label("listingsTitle"),
      rows: [
        [label("listing"), ...(data.isAgency ? [label("agentFilter")] : []), ...keys.map((key) => label(key))],
        ...data.rows.map((row) => [row.title, ...(data.isAgency ? [row.author?.name ?? null] : []), ...keys.map((key) => row[key])]),
      ],
    },
    {
      name: label("trendTitle"),
      rows: [[label("export.day"), label("views"), label("contactReveals")], ...data.series.map((point) => [point.day, point.views, point.contactReveals])],
    },
  ];
}
