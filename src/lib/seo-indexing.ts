import type { IndexPolicy } from "@/lib/seo";
import { propertyFiltersToLandingPath } from "@/lib/seo-landings";

export type SearchParamInput = Record<string, string | string[] | undefined>;

export type SearchIndexDecision = {
  canonicalPath: string | null;
  indexPolicy: IndexPolicy;
  page: number;
  validPage: boolean;
};

function readPage(value: string | string[] | undefined) {
  if (value === undefined) return { page: 1, validPage: true };
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    return { page: 1, validPage: false };
  }
  const page = Number(value);
  return { page, validPage: Number.isSafeInteger(page) };
}

function classifySearchParams(
  params: SearchParamInput,
  basePath: string,
  filterKeys: ReadonlySet<string>,
): SearchIndexDecision {
  const { page, validPage } = readPage(params.sehife);
  const keys = Object.keys(params);
  const hasUnknownKey = keys.some((key) => key !== "sehife" && !filterKeys.has(key));
  const hasFilter = keys.some((key) => key !== "sehife");

  if (!validPage) {
    return { canonicalPath: null, indexPolicy: "noindex-follow", page, validPage: false };
  }

  if (hasFilter || hasUnknownKey) {
    return { canonicalPath: null, indexPolicy: "noindex-follow", page, validPage: true };
  }

  return {
    canonicalPath: page > 1 ? `${basePath}?sehife=${page}` : basePath,
    indexPolicy: "index",
    page,
    validPage: true,
  };
}

const PROPERTY_FILTER_KEYS = new Set([
  "elan",
  "axtaris",
  "tip",
  "seher",
  "rayon",
  "metro",
  "otaq",
  "min",
  "max",
  "sahe_min",
  "sahe_max",
  "temir",
  "sened",
  "siralama",
  "tikili",
  "dovr",
  "mertebe_min",
  "mertebe_max",
  "ilk_mertebe_yox",
  "son_mertebe_yox",
  "sekilli",
  "xususiyyet",
]);

export function classifyPropertySearchParams(params: SearchParamInput): SearchIndexDecision {
  const decision = classifySearchParams(params, "/emlaklar", PROPERTY_FILTER_KEYS);
  if (!decision.validPage || decision.indexPolicy === "index") return decision;

  const filterKeys = Object.keys(params).filter((key) => key !== "sehife");
  if (
    filterKeys.length === 0 ||
    filterKeys.some((key) => key !== "elan" && key !== "tip") ||
    filterKeys.some((key) => typeof params[key] !== "string")
  ) {
    return decision;
  }

  const landingPath = propertyFiltersToLandingPath({
    ...(typeof params.elan === "string" ? { listingType: params.elan } : {}),
    ...(typeof params.tip === "string" ? { typeSlug: params.tip } : {}),
  });
  return landingPath
    ? {
        ...decision,
        canonicalPath:
          decision.page > 1 ? `${landingPath}?sehife=${decision.page}` : landingPath,
      }
    : decision;
}

export function classifyBlogSearchParams(params: SearchParamInput): SearchIndexDecision {
  return classifySearchParams(params, "/blog", new Set(["kateqoriya"]));
}
