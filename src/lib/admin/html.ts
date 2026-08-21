import { ELEMENT_NODE, transform, walk, type Node } from "ultrahtml";
import sanitize from "ultrahtml/transformers/sanitize";

/**
 * Bloq kontentinin təmizlənməsi.
 *
 * Məqalə mətni ictimai səhifədə `dangerouslySetInnerHTML` ilə verilir. Redaktor
 * etibarlı şəxsdir, amma hesabı ələ keçirilə bilər — ona görə HTML **yazılmadan
 * əvvəl** ağ siyahı üzrə süzülür. Təmizlik saxlama anındadır, göstərmə anında deyil:
 * bazadakı məlumat həmişə təhlükəsiz vəziyyətdə qalır və hər səhifə baxışında
 * təkrar emal aparılmır.
 *
 * İki qat var:
 * 1. `ultrahtml` sanitizer — icazəsiz element və atributları atır.
 * 2. Ünvan yoxlaması — `javascript:`, `data:` və kənar `src` dəyərləri kəsilir.
 *    Sanitizer atribut **adına** baxır, dəyərinə yox; `<a href="javascript:...">`
 *    yalnız bu ikinci qatda tutulur.
 */

const ALLOW_ELEMENTS = [
  "p", "br", "hr", "span", "div",
  "strong", "b", "em", "i", "u", "s", "mark", "sup", "sub",
  "h2", "h3", "h4", "h5",
  "ul", "ol", "li",
  "blockquote", "code", "pre",
  "a", "img", "figure", "figcaption",
  "table", "thead", "tbody", "tr", "th", "td",
];

const ALLOW_ATTRIBUTES: Record<string, string[]> = {
  href: ["a"],
  title: ["a", "img"],
  target: ["a"],
  rel: ["a"],
  src: ["img"],
  alt: ["img"],
  width: ["img"],
  height: ["img"],
  loading: ["img"],
  colspan: ["th", "td"],
  rowspan: ["th", "td"],
};

/** Linkdə icazəli sxemlər — `javascript:` və `data:` qəsdən yoxdur. */
function isSafeHref(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return true;
  return /^(https?:|mailto:|tel:)/i.test(trimmed);
}

/** Şəkil yalnız öz media anbarımızdan və ya icazəli stok mənbədən gələ bilər. */
function isSafeSrc(value: string): boolean {
  const trimmed = value.trim();
  return (
    trimmed.startsWith("/media/") ||
    trimmed.startsWith("https://images.unsplash.com/") ||
    trimmed.startsWith("https://media.luxehomeestate.az/")
  );
}

async function guardAttributes(doc: Node): Promise<Node> {
  await walk(doc, (node) => {
    if (node.type !== ELEMENT_NODE) return;
    const attributes = node.attributes as Record<string, string>;

    // `ultrahtml` sanitizer-i `allowAttributes` siyahısında **olmayan** atributu
    // saxlayır — siyahı yalnız adı çəkilənləri hansı teqlərdə buraxmağı təyin edir.
    // Ona görə ağ siyahı burada özümüz tətbiq olunur: əks halda `onclick` sağ qalırdı.
    for (const name of Object.keys(attributes)) {
      const allowedOn = ALLOW_ATTRIBUTES[name.toLowerCase()];
      if (!allowedOn || !allowedOn.includes(node.name)) delete attributes[name];
    }

    if (typeof attributes.href === "string" && !isSafeHref(attributes.href)) {
      delete attributes.href;
    }

    if (node.name === "img") {
      if (typeof attributes.src !== "string" || !isSafeSrc(attributes.src)) {
        // Mənbəsiz `img` mənasızdır — boş atribut əvəzinə görünməz saxlanılır
        attributes.src = "";
      }
      attributes.loading ??= "lazy";
      attributes.alt ??= "";
    }

    // Kənar linklər həmişə təhlükəsiz açılır: `noopener` olmadan açılan səhifə
    // `window.opener` üzərindən bizim səhifəni yönləndirə bilir
    if (node.name === "a" && attributes.target === "_blank") {
      attributes.rel = "noopener noreferrer";
    }
  });

  return doc;
}

export async function sanitizeRichText(html: string): Promise<string> {
  return transform(html, [
    sanitize({
      allowElements: ALLOW_ELEMENTS,
      allowAttributes: ALLOW_ATTRIBUTES,
      allowComments: false,
      allowComponents: false,
      allowCustomElements: false,
    }),
    guardAttributes,
  ]);
}

/** Meta təsvir və oxunma müddəti üçün HTML-siz mətn. */
export function stripTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
