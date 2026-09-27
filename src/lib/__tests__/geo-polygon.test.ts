import { describe, expect, it } from "vitest";
import { boundingBox, parsePolygon, pointInPolygon, serializePolygon, type LatLng } from "@/lib/geo-polygon";

const square: LatLng[] = [[40.37, 49.8], [40.37, 49.9], [40.43, 49.9], [40.43, 49.8]];

describe("xəritədə çəkilmiş sahə", () => {
  it("URL dəyərini oxuyur və eyni formada geri yazır", () => {
    const raw = "40.370001,49.8;40.37,49.9;40.43,49.9";
    const polygon = parsePolygon(raw);
    expect(polygon).toEqual([[40.37, 49.8], [40.37, 49.9], [40.43, 49.9]]);
    expect(serializePolygon(polygon!)).toBe("40.37,49.8;40.37,49.9;40.43,49.9");
  });

  it("az/çox nöqtəni, pozulmuş dəyəri və ölkədən kənar koordinatı rədd edir", () => {
    expect(parsePolygon("40.3,49.8;40.4,49.9")).toBeNull();
    expect(parsePolygon(Array.from({ length: 21 }, () => "40.4,49.8").join(";"))).toBeNull();
    expect(parsePolygon("40.3,abc;40.4,49.9;40.5,49.9")).toBeNull();
    expect(parsePolygon("55.7,37.6;55.8,37.7;55.9,37.6")).toBeNull();
    expect(parsePolygon(undefined)).toBeNull();
  });

  it("nöqtənin sahənin içində olub-olmadığını düzgün təyin edir", () => {
    expect(pointInPolygon([40.4, 49.85], square)).toBe(true);
    expect(pointInPolygon([40.5, 49.85], square)).toBe(false);
    const concave: LatLng[] = [[40.3, 49.8], [40.5, 49.8], [40.5, 49.9], [40.4, 49.85], [40.3, 49.9]];
    // Çuxur sağ tərəfdədir: y=40.45-də daxili hissə x ≈ 49.875-ə qədərdir.
    expect(pointInPolygon([40.45, 49.86], concave)).toBe(true);
    expect(pointInPolygon([40.45, 49.89], concave)).toBe(false);
    expect(pointInPolygon([40.4, 49.84], concave)).toBe(true);
    expect(pointInPolygon([40.4, 49.87], concave)).toBe(false);
  });

  it("sərhəd qutusunu hesablayır", () => {
    expect(boundingBox(square)).toEqual({ minLat: 40.37, maxLat: 40.43, minLng: 49.8, maxLng: 49.9 });
  });
});
