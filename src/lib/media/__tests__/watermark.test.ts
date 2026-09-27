import { describe, expect, it } from "vitest";
import {
  DETECTION_SIZE,
  WATERMARK_OPACITY,
  buildWatermarkTemplate,
  controlBox,
  isWatermarkDetected,
  scaledDimensions,
  watermarkBox,
  watermarkScore,
} from "../watermark";

const N = DETECTION_SIZE;

/** Deterministik psevdo-təsadüfi ədəd — test nəticəsi hər dəfə eyni olsun. */
function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

/** Loqoya bənzər şablon: halqa, şaquli zolaqlar və dam xətti. */
function syntheticLogo(): Uint8Array {
  const rgba = new Uint8Array(N * N * 4);
  const center = N / 2;
  for (let y = 0; y < N; y += 1) {
    for (let x = 0; x < N; x += 1) {
      const distance = Math.hypot(x - center, y - center);
      const ring = distance > N * 0.4 && distance < N * 0.45;
      const bars = y > N * 0.2 && y < N * 0.7 && x > N * 0.3 && x < N * 0.7 && x % 6 < 2;
      const roof = Math.abs(y - (N * 0.75 - Math.abs(x - center) * 0.5)) < 1.5 && x > N * 0.15 && x < N * 0.85;
      const offset = (y * N + x) * 4;
      if (ring || bars || roof) {
        rgba.set([212, 175, 90, 255], offset);
      }
    }
  }
  return rgba;
}

/** Hamar qradiyent + səs-küy + təsadüfi ləkələr — təbii foto fonu kimi. */
function background(seed: number, noise: number): Uint8Array {
  const next = random(seed);
  const rgba = new Uint8Array(N * N * 4);
  const blobs = Array.from({ length: 6 }, () => ({ x: next() * N, y: next() * N, r: 4 + next() * 14, v: next() * 120 - 60 }));
  for (let y = 0; y < N; y += 1) {
    for (let x = 0; x < N; x += 1) {
      let value = 90 + (x + y) * 0.8;
      for (const blob of blobs) if (Math.hypot(x - blob.x, y - blob.y) < blob.r) value += blob.v;
      value += (next() - 0.5) * noise;
      const offset = (y * N + x) * 4;
      const v = Math.max(0, Math.min(255, value));
      rgba.set([v, v * 0.95, v * 0.9, 255], offset);
    }
  }
  return rgba;
}

function composite(base: Uint8Array, logo: Uint8Array): Uint8Array {
  const out = new Uint8Array(base);
  for (let index = 0; index < N * N; index += 1) {
    const alpha = (logo[index * 4 + 3] / 255) * WATERMARK_OPACITY;
    for (let component = 0; component < 3; component += 1) {
      const offset = index * 4 + component;
      out[offset] = Math.round(base[offset] * (1 - alpha) + logo[offset] * alpha);
    }
  }
  return out;
}

describe("su nişanının həndəsəsi", () => {
  it("nişan eninə nisbətdir — kiçildilmiş surətdə eyni nisbi mövqedədir", () => {
    const master = watermarkBox(2400, 1600);
    const copy = watermarkBox(1200, 800);
    expect(master.size / 2400).toBeCloseTo(copy.size / 1200, 2);
    expect(master.left / 2400).toBeCloseTo(copy.left / 1200, 2);
    expect(master.top / 1600).toBeCloseTo(copy.top / 800, 2);
    expect(master.left + master.size + master.margin).toBe(2400);
  });

  it("nəzarət qutusu sol-alt küncdədir və panoramda qutu hündürlüyü aşmır", () => {
    expect(controlBox(1000, 700).left).toBe(watermarkBox(1000, 700).margin);
    const panorama = watermarkBox(3000, 200);
    expect(panorama.size).toBeLessThanOrEqual(90);
    expect(panorama.top).toBeGreaterThanOrEqual(0);
  });

  it("scale-down böyük şəkli kiçildir, kiçiyi böyütmür", () => {
    expect(scaledDimensions(4800, 3200, 2400)).toEqual({ width: 2400, height: 1600 });
    expect(scaledDimensions(800, 600, 2400)).toEqual({ width: 800, height: 600 });
  });
});

describe("mövcud su nişanının aşkarlanması", () => {
  const logo = syntheticLogo();
  const template = buildWatermarkTemplate(logo);

  it("nişanlı qutunu müxtəlif fonlarda tanıyır", () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const plain = background(seed, 18);
      const control = watermarkScore(background(seed + 100, 18), template);
      const score = watermarkScore(composite(plain, logo), template);
      expect(isWatermarkDetected(score, control), `seed ${seed}: ${score} / ${control}`).toBe(true);
    }
  });

  it("nişansız fotoda nişan «tapmır»", () => {
    for (const seed of [11, 12, 13, 14, 15, 16, 17, 18]) {
      const score = watermarkScore(background(seed, 40), template);
      const control = watermarkScore(background(seed + 50, 40), template);
      expect(isWatermarkDetected(score, control), `seed ${seed}: ${score}`).toBe(false);
    }
  });

  it("hər iki küncdə eyni tekstura olanda (məs. təkrarlanan naxış) nişan saymır", () => {
    const pattern = composite(background(7, 10), logo);
    const score = watermarkScore(pattern, template);
    expect(isWatermarkDetected(score, score)).toBe(false);
  });
});
