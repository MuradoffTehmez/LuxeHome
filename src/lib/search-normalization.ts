/** Azərbaycan mətnini diakritikdən asılı olmayan sabit ASCII formaya salır. */
export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFKD")
    .toLocaleLowerCase("az-AZ")
    .replace(/ə/g, "e")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function propertySearchText(input: { title: string; description: string; address?: string | null }): string {
  return normalizeSearchText([input.title, input.description, input.address ?? ""].join(" "));
}
