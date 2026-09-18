import { describe, expect, it, vi } from "vitest";

import { createFavoriteAccountSync } from "../favorite-account-sync";

describe("favorit hesab sinxronu", () => {
  it("paralel kartlar üçün yalnız bir GET göndərir", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({ ids: [], signedIn: false }),
    );
    const sync = createFavoriteAccountSync(fetcher);

    await Promise.all([
      sync.read(["property-1"]),
      sync.read(["property-1"]),
      sync.read(["property-1"]),
    ]);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith(
      "/api/hesab/favoritler",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("anonim istifadəçinin dəyişikliklərini serverə göndərmir", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({ ids: [], signedIn: false }),
    );
    const sync = createFavoriteAccountSync(fetcher);

    await sync.read([]);
    await sync.persist(["property-1"]);

    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("daxil olmuş istifadəçinin lokal və server favoritlərini birləşdirir", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ ids: ["property-2"], signedIn: true }))
      .mockResolvedValueOnce(Response.json({ ids: ["property-1", "property-2"] }));
    const sync = createFavoriteAccountSync(fetcher);

    await expect(sync.read(["property-1"])).resolves.toEqual(["property-1", "property-2"]);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[1]?.[1]).toMatchObject({
      method: "PUT",
      body: JSON.stringify({ ids: ["property-1", "property-2"] }),
    });
  });
});

