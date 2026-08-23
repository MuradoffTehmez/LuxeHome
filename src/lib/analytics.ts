/**
 * Cloudflare GraphQL Analytics API-dən zona trafik statistikası.
 *
 * `CLOUDFLARE_ANALYTICS_TOKEN` (secret, `Account Analytics:Read` səlahiyyəti ilə)
 * və `CF_ZONE_ID` (vars, sirr deyil) lazımdır. Hər ikisi Workers-də yalnız
 * sorğu kontekstində dolur, ona görə oxuma ilk istifadə anında baş verir.
 */

const GRAPHQL_ENDPOINT = "https://api.cloudflare.com/client/v4/graphql";

export type DailyTraffic = {
  date: string;
  requests: number;
  pageViews: number;
  uniques: number;
  cachedRequests: number;
};

export type SearchAnalyticsResult =
  | { available: true; days: DailyTraffic[] }
  | { available: false; reason: string };

type GraphQlHttpRequestsGroup = {
  dimensions: { date: string };
  sum: { requests: number; pageViews: number; cachedRequests: number };
  uniq: { uniques: number };
};

type GraphQlResponse = {
  errors?: { message: string }[];
  data?: {
    viewer?: {
      zones?: { httpRequests1dGroups?: GraphQlHttpRequestsGroup[] }[];
    };
  };
};

/** Son N gün üçün gündəlik sorğu/pageview/unikal ziyarətçi statistikası. */
export async function getSearchAnalytics(daysBack = 14): Promise<SearchAnalyticsResult> {
  const token = process.env.CLOUDFLARE_ANALYTICS_TOKEN;
  const zoneTag = process.env.CF_ZONE_ID;

  if (!token || !zoneTag) {
    return { available: false, reason: "CLOUDFLARE_ANALYTICS_TOKEN və ya CF_ZONE_ID təyin edilməyib." };
  }

  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const until = new Date().toISOString().slice(0, 10);

  const query = /* GraphQL */ `
    query SearchAnalytics($zoneTag: string, $since: Date, $until: Date) {
      viewer {
        zones(filter: { zoneTag: $zoneTag }) {
          httpRequests1dGroups(
            limit: 60
            filter: { date_geq: $since, date_leq: $until }
            orderBy: [date_ASC]
          ) {
            dimensions { date }
            sum { requests pageViews cachedRequests }
            uniq { uniques }
          }
        }
      }
    }
  `;

  let response: Response;
  try {
    response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables: { zoneTag, since, until } }),
    });
  } catch {
    return { available: false, reason: "Cloudflare Analytics API-yə şəbəkə xətası." };
  }

  if (!response.ok) {
    return { available: false, reason: `Cloudflare API xətası (HTTP ${response.status}).` };
  }

  const json = (await response.json()) as GraphQlResponse;
  if (json.errors?.length) {
    return { available: false, reason: json.errors[0]?.message ?? "Naməlum GraphQL xətası." };
  }

  const groups = json.data?.viewer?.zones?.[0]?.httpRequests1dGroups ?? [];
  return {
    available: true,
    days: groups.map((group) => ({
      date: group.dimensions.date,
      requests: group.sum.requests,
      pageViews: group.sum.pageViews,
      uniques: group.uniq.uniques,
      cachedRequests: group.sum.cachedRequests,
    })),
  };
}
