"use client";

import { useEffect } from "react";
import { trackEvent, type AnalyticsEvent, type AnalyticsPayload } from "@/lib/client-analytics";

export function AnalyticsEventBeacon({ event, payload = {} }: { event: AnalyticsEvent; payload?: AnalyticsPayload }) {
  useEffect(() => trackEvent(event, payload), [event, payload]);
  return null;
}

export function TrackedAnchor({ event, payload = {}, ...props }: React.ComponentProps<"a"> & { event: AnalyticsEvent; payload?: AnalyticsPayload }) {
  return <a {...props} onClick={(click) => { props.onClick?.(click); trackEvent(event, payload); }} />;
}
