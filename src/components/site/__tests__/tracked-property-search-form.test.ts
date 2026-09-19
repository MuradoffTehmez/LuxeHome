import { describe, expect, it } from "vitest";

import { countActiveSearchFilters } from "../tracked-property-search-form";

describe("əmlak axtarışı analitikası", () => {
  it("yalnız dolu filtr dəyərlərini sayır", () => {
    const data = new FormData();
    data.append("elan", "SALE");
    data.append("axtaris", "  ");
    data.append("tip", "villa");
    data.append("seher", "");

    expect(countActiveSearchFilters(data)).toBe(2);
  });
});
