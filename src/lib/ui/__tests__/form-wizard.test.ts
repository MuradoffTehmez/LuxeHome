import { describe, expect, it } from "vitest";
import { DRAFT_MAX_AGE_MS, draftReader, parseDraft, serializeDraft, wizardProgress } from "../form-wizard";

describe("elan sehrbazı", () => {
  it("4-cü addımda 3/8 addım tamamlanıb — 37%", () => {
    expect(wizardProgress(3, 8)).toEqual({ completed: 3, total: 8, percent: 37 });
    expect(wizardProgress(0, 8).percent).toBe(0);
    expect(wizardProgress(8, 8).percent).toBe(100);
  });

  it("qaralamaya fayl, server action və bot tələsi sahələrini yazmır", () => {
    const draft = serializeDraft(
      [
        ["title", "Mənzil"],
        ["$ACTION_ID_abc", "x"],
        ["website", "spam"],
        ["featureIds", "a"],
        ["featureIds", "b"],
        ["photo", new File(["x"], "a.jpg")],
      ],
      2,
      new Date("2026-09-27T10:00:00Z"),
    );
    expect(draft.entries).toEqual([
      ["title", "Mənzil"],
      ["featureIds", "a"],
      ["featureIds", "b"],
    ]);
    const read = draftReader(draft.entries);
    expect(read.all("featureIds")).toEqual(["a", "b"]);
    expect(read.get("title")).toBe("Mənzil");
  });

  it("köhnə və ya zədələnmiş qaralamanı təklif etmir", () => {
    const now = Date.parse("2026-09-27T10:00:00Z");
    const fresh = JSON.stringify(serializeDraft([["title", "A"]], 1, new Date(now - 1000)));
    const stale = JSON.stringify(serializeDraft([["title", "A"]], 1, new Date(now - DRAFT_MAX_AGE_MS - 1)));
    expect(parseDraft(fresh, now)?.step).toBe(1);
    expect(parseDraft(stale, now)).toBeNull();
    expect(parseDraft("{bad", now)).toBeNull();
    expect(parseDraft(null, now)).toBeNull();
  });

  it("şəkil siyahısını JSON sətirlərdən oxuyur", () => {
    const read = draftReader([["images", JSON.stringify({ url: "/media/a.webp", alt: "", isCover: true })], ["images", "{bad"]]);
    expect(read.json<{ url: string }>("images")).toEqual([{ url: "/media/a.webp", alt: "", isCover: true }]);
  });
});
