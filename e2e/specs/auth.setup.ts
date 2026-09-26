import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { test as setup } from "@playwright/test";
import { ADMIN_STORAGE_STATE, authFixturesEnabled, signInAsAdmin } from "../support/auth";

/** Admin 2FA girişi bir dəfə — sessiya `ADMIN_STORAGE_STATE`-ə yazılır (#87). */
setup("admin 2FA ilə daxil olur", async ({ page, baseURL }) => {
  mkdirSync(dirname(ADMIN_STORAGE_STATE), { recursive: true });
  if (!authFixturesEnabled) {
    writeFileSync(ADMIN_STORAGE_STATE, JSON.stringify({ cookies: [], origins: [] }));
    setup.skip(true, "auth fixture-ları yoxdur (staging run)");
    return;
  }
  await signInAsAdmin(page, baseURL!);
  await page.context().storageState({ path: ADMIN_STORAGE_STATE });
});
