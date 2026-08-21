/**
 * OpenNext `next-themes` funksiyasını string-ə çevirəndə esbuild-in əlavə etdiyi
 * `__name` çağırışı inline skriptə düşür, köməkçinin özü isə düşmür. Statik string
 * olduğu üçün bu tərif build transformasiyasından keçmir və mövzu skriptindən əvvəl
 * brauzerdə əlçatan olur.
 */
export const THEME_RUNTIME_SHIM =
  "globalThis.__name ??= (target, value) => " +
  'Object.defineProperty(target, "name", { value, configurable: true });';
