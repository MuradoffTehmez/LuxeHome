import { expect, it } from "vitest";
import { createMediaRecordWithRollback } from "../upload-record";

it("Media sətri yazılmasa R2 şəklini geri silir", async () => {
  const deleted: string[] = [];
  await expect(
    createMediaRecordWithRollback(
      {
        createRecord: async () => {
          throw new Error("D1 xətası");
        },
        deleteImage: async (url) => {
          deleted.push(url);
        },
        logCleanupFailure: () => undefined,
      },
      "/media/emlaklar/image.webp",
    ),
  ).rejects.toThrow("D1 xətası");
  expect(deleted).toEqual(["/media/emlaklar/image.webp"]);
});

it("R2 rollback xətası ilkin D1 xətasını gizlətmir", async () => {
  const logged: unknown[] = [];
  await expect(
    createMediaRecordWithRollback(
      {
        createRecord: async () => {
          throw new Error("D1 xətası");
        },
        deleteImage: async () => {
          throw new Error("R2 xətası");
        },
        logCleanupFailure: (error) => logged.push(error),
      },
      "/media/emlaklar/image.webp",
    ),
  ).rejects.toThrow("D1 xətası");
  expect(logged).toHaveLength(1);
});
