"use client";

import { useEffect } from "react";
import { attemptDeploymentReload } from "@/lib/deployment-recovery";

/** Açıq tab yeni deploy-un Server Action/chunk identifikatorları ilə toqquşanda özünü bərpa edir. */
export function DeploymentRecovery() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      attemptDeploymentReload(event.error ?? event.message);
    };
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      attemptDeploymentReload(event.reason);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}

