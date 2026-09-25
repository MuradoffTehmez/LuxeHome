import { expect, it } from "vitest";
import {
  createMediaRecordOnce,
  createMediaRecordWithRollback,
  isUniqueViolation,
  parseClientUploadId,
} from "../upload-record";

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

it("idempotentlik açarı yalnız təhlükəsiz formatda qəbul edilir", () => {
  expect(parseClientUploadId("5f1c2b9e-8a4d-4c3b-9e2f-1a2b3c4d5e6f")).toBe("5f1c2b9e-8a4d-4c3b-9e2f-1a2b3c4d5e6f");
  expect(parseClientUploadId("  abcdef12  ")).toBe("abcdef12");
  expect(parseClientUploadId("short")).toBeNull();
  expect(parseClientUploadId("x".repeat(65))).toBeNull();
  expect(parseClientUploadId("'; DROP TABLE Media; --")).toBeNull();
  expect(parseClientUploadId(null)).toBeNull();
});

it("eyni açarlı paralel sorğu artıq yazıbsa öz R2 obyektini silib mövcud sətri qaytarır", async () => {
  const deleted: string[] = [];
  const existing = { id: "media-1", url: "/media/emlaklar/first.webp" };
  await expect(
    createMediaRecordOnce(
      {
        createRecord: async () => {
          throw Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
        },
        findExisting: async () => existing,
        deleteImage: async (url) => {
          deleted.push(url);
        },
        logCleanupFailure: () => undefined,
      },
      "/media/emlaklar/second.webp",
    ),
  ).resolves.toBe(existing);
  expect(deleted).toEqual(["/media/emlaklar/second.webp"]);
});

it("unikal toqquşma olmayan xətanı gizlətmir", async () => {
  await expect(
    createMediaRecordOnce(
      {
        createRecord: async () => {
          throw new Error("D1 xətası");
        },
        findExisting: async () => ({ id: "x" }),
        deleteImage: async () => undefined,
        logCleanupFailure: () => undefined,
      },
      "/media/emlaklar/a.webp",
    ),
  ).rejects.toThrow("D1 xətası");
  expect(isUniqueViolation({ code: "P2002" })).toBe(true);
  expect(isUniqueViolation(new Error("x"))).toBe(false);
});
