"use client";

import { useEffect, useState } from "react";
import { classifyAcquisition } from "@/lib/lead-attribution";

type Attribution = Record<string, string>;

export function AttributionFields() {
  const [values, setValues] = useState<Attribution>({});

  useEffect(() => {
    const url = new URL(window.location.href);
    const referrer = document.referrer;
    const utmSource = url.searchParams.get("utm_source") ?? "";
    const utmMedium = url.searchParams.get("utm_medium") ?? "";
    const acquisition = classifyAcquisition({ referrer, utmSource, utmMedium });
    setValues({
      acquisitionSource: acquisition.source,
      acquisitionMedium: acquisition.medium,
      landingPage: `${url.pathname}${url.search}`.slice(0, 300),
      referrer: referrer.slice(0, 300),
      utmSource,
      utmMedium,
      utmCampaign: url.searchParams.get("utm_campaign") ?? "",
      utmTerm: url.searchParams.get("utm_term") ?? "",
      utmContent: url.searchParams.get("utm_content") ?? "",
    });
  }, []);

  return <>{Object.entries(values).map(([name, value]) => (
    <input key={name} type="hidden" name={name} value={value} />
  ))}</>;
}

