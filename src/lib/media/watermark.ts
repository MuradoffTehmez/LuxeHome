/**
 * Elan şəkillərinin su nişanı: həndəsə və mövcud nişanın aşkarlanması.
 *
 * **Niyə həndəsə eninə nisbətdir.** Nişan şəklin eninin sabit hissəsi qədər
 * çəkilir və kənardan məsafəsi də enə nisbətdir. Beləliklə master (2400 px),
 * kiçik nüsxə (640 px) və saytdan endirilib kiçildilmiş istənilən surət eyni
 * nisbi mövqedə, eyni nisbi ölçüdə nişan daşıyır — aşkarlama ölçüdən asılı olmur.
 *
 * **Aşkarlama necə işləyir.** Şəklin sağ-alt küncündəki nişan qutusu və loqonun
 * özü eyni kiçik ölçüyə (`DETECTION_SIZE`) gətirilir. Loqonun kənarları (alfa və
 * parlaqlıq qradiyenti) ilə qutudakı parlaqlıq qradiyenti arasında normallaşdırılmış
 * korrelyasiya hesablanır. Nişan olan şəkildə loqonun xətləri qutuda eynilə
 * görünür, təbii fotoda isə təsadüfi kənarlar loqonun formasını təkrarlamır.
 * Fon teksturasının təsadüfən uyğun gəlməsinə qarşı eyni ölçü şəklin sol-alt
 * küncündə (nəzarət qutusu) də ölçülür və fərq tələb olunur.
 *
 * Səhv tərəf qəsdən asimmetrikdir: nişanı «tapmamaq» yalnız ikiqat nişan verir
 * (kosmetik), səhvən «tapmaq» isə şəkli nişansız buraxardı. Ona görə hədlər
 * mühafizəkardır və hər xətada nişan tətbiq olunur.
 */

/** Nişanın eni — şəkil eninin hissəsi. */
export const WATERMARK_WIDTH_RATIO = 0.12;
/** Sağ və alt kənardan məsafə — şəkil eninin hissəsi. */
export const WATERMARK_MARGIN_RATIO = 0.02;
/** Nişanın qeyri-şəffaflığı: görünür, amma fotonu örtmür. */
export const WATERMARK_OPACITY = 0.55;
/** Çox kiçik şəkildə loqo oxunmaz olmasın deyə alt hədd. */
const WATERMARK_MIN_SIZE = 40;
const WATERMARK_MIN_MARGIN = 8;

/** Aşkarlama üçün qutunun və loqonun gətirildiyi kvadrat ölçü (px). */
export const DETECTION_SIZE = 64;
/** Nişan qutusundakı minimum korrelyasiya. */
export const DETECTION_MIN_SCORE = 0.42;
/** Nişan qutusu nəzarət qutusundan ən azı bu qədər yüksək olmalıdır. */
export const DETECTION_MIN_MARGIN = 0.18;

export type WatermarkBox = {
  size: number;
  margin: number;
  left: number;
  top: number;
};

/**
 * Verilmiş ölçülü şəkildə nişanın qutusu. Loqo kvadratdır (`logo-mark`),
 * ona görə hündürlük enə bərabərdir. Uzun panoramda qutu hündürlüyü aşmasın
 * deyə ölçü hündürlüyün 45%-i ilə məhdudlaşır.
 */
export function watermarkBox(width: number, height: number): WatermarkBox {
  const margin = Math.max(WATERMARK_MIN_MARGIN, Math.round(width * WATERMARK_MARGIN_RATIO));
  const size = Math.max(
    1,
    Math.min(
      Math.max(WATERMARK_MIN_SIZE, Math.round(width * WATERMARK_WIDTH_RATIO)),
      Math.round(height * 0.45),
      width - 2 * margin,
    ),
  );
  return {
    size,
    margin,
    left: Math.max(0, width - margin - size),
    top: Math.max(0, height - margin - size),
  };
}

/** Nəzarət qutusu: eyni ölçü, sol-alt künc. */
export function controlBox(width: number, height: number): WatermarkBox {
  const box = watermarkBox(width, height);
  return { ...box, left: box.margin };
}

/** `scale-down` çevirməsindən sonra şəklin ölçüsü. */
export function scaledDimensions(width: number, height: number, maxWidth: number) {
  if (width <= maxWidth) return { width, height };
  return { width: maxWidth, height: Math.max(1, Math.round((height * maxWidth) / width)) };
}

/** RGBA baytlarından [0..1] parlaqlıq (Rec. 709). */
function luminance(rgba: Uint8Array, size: number): Float32Array {
  const out = new Float32Array(size * size);
  for (let index = 0; index < out.length; index += 1) {
    const offset = index * 4;
    out[index] = (0.2126 * rgba[offset] + 0.7152 * rgba[offset + 1] + 0.0722 * rgba[offset + 2]) / 255;
  }
  return out;
}

function channel(rgba: Uint8Array, size: number, component: number): Float32Array {
  const out = new Float32Array(size * size);
  for (let index = 0; index < out.length; index += 1) out[index] = rgba[index * 4 + component] / 255;
  return out;
}

/** Mərkəzi fərqlə qradiyent böyüklüyü; kənar piksellər sıfırdır. */
function gradient(values: Float32Array, size: number): Float32Array {
  const out = new Float32Array(size * size);
  for (let y = 1; y < size - 1; y += 1) {
    for (let x = 1; x < size - 1; x += 1) {
      const index = y * size + x;
      const gx = values[index + 1] - values[index - 1];
      const gy = values[index + size] - values[index - size];
      out[index] = Math.abs(gx) + Math.abs(gy);
    }
  }
  return out;
}

/** Normallaşdırılmış çarpaz korrelyasiya: [-1..1]; sabit siqnalda 0. */
export function normalizedCorrelation(a: Float32Array, b: Float32Array): number {
  const length = Math.min(a.length, b.length);
  if (length === 0) return 0;
  let meanA = 0;
  let meanB = 0;
  for (let index = 0; index < length; index += 1) {
    meanA += a[index];
    meanB += b[index];
  }
  meanA /= length;
  meanB /= length;
  let numerator = 0;
  let varianceA = 0;
  let varianceB = 0;
  for (let index = 0; index < length; index += 1) {
    const da = a[index] - meanA;
    const db = b[index] - meanB;
    numerator += da * db;
    varianceA += da * da;
    varianceB += db * db;
  }
  const denominator = Math.sqrt(varianceA * varianceB);
  return denominator > 1e-9 ? numerator / denominator : 0;
}

export type WatermarkTemplate = {
  alphaEdges: Float32Array;
  toneEdges: Float32Array;
};

/** Loqonun RGBA baytlarından (DETECTION_SIZE²) kənar şablonu. */
export function buildWatermarkTemplate(logoRgba: Uint8Array, size = DETECTION_SIZE): WatermarkTemplate {
  const alpha = channel(logoRgba, size, 3);
  const tone = luminance(logoRgba, size);
  // Şəffaf piksellərin rəngi mənasızdır — premultiplied parlaqlıq istifadə olunur.
  for (let index = 0; index < tone.length; index += 1) tone[index] *= alpha[index];
  return { alphaEdges: gradient(alpha, size), toneEdges: gradient(tone, size) };
}

/** Qutunun loqoya bənzərlik balı. */
export function watermarkScore(regionRgba: Uint8Array, template: WatermarkTemplate, size = DETECTION_SIZE): number {
  const edges = gradient(luminance(regionRgba, size), size);
  return Math.max(
    normalizedCorrelation(edges, template.alphaEdges),
    normalizedCorrelation(edges, template.toneEdges),
  );
}

/** Nişan qutusu və nəzarət qutusu ballarından son qərar. */
export function isWatermarkDetected(score: number, controlScore: number): boolean {
  return score >= DETECTION_MIN_SCORE && score - controlScore >= DETECTION_MIN_MARGIN;
}
