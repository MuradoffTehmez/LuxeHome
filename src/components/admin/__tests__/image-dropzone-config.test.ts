import { expect, it } from "vitest";
import { DEFAULT_IMAGE_UPLOAD_URL } from "../image-dropzone-config";

it("admin forma üçün mövcud media endpoint-ini default saxlayır", () => {
  expect(DEFAULT_IMAGE_UPLOAD_URL).toBe("/api/admin/media");
});
