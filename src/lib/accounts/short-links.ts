/**
 * Qısa ünvanlar — ən çox işlənən kabinet funksiyalarına bir addımda çatmaq üçün.
 * Məs. `luxehomeestate.az/az/elan-yerlesdir` birbaşa yeni elan sehrbazını açır.
 * Hər qısa ünvanın öz marşrut faylı var (`(account)/<qısa>/page.tsx`) — dinamik
 * seqment `(site)` qrupundakı `[seoLanding]` ilə toqquşardı.
 */
export const SHORT_LINKS = {
  "/elan-yerlesdir": "/kabinet/elanlar/yeni",
  "/elanlarim": "/kabinet/elanlar",
  "/profilim": "/kabinet/profil",
} as const;

export type ShortLink = keyof typeof SHORT_LINKS;
