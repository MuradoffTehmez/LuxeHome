import { notFound, permanentRedirect, redirect } from "next/navigation";
import { headers } from "next/headers";
import { findActiveRedirect, recordNotFoundHit } from "@/lib/queries";

// Yönləndirmə cədvəli D1-də saxlanılır, ona görə hər sorğu anında oxunmalıdır.
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string[] }>;
};

/**
 * Bilinməyən bütün ictimai marşrutların son dayanacağı.
 *
 * Next.js daha spesifik route-ları (statik səhifələr, `[slug]` dinamik
 * route-lar) bundan əvvəl yoxlayır — bura yalnız heç birinə uyğun gəlməyən
 * yol düşür. Əvvəlcə `Redirect` cədvəlində uyğunluq axtarılır; tapılmasa
 * `NotFoundHit` sayğacı artırılır və əsl 404 göstərilir.
 */
export default async function CatchAllPage({ params }: Props) {
  const { slug } = await params;
  const path = `/${slug.join("/")}`;

  const match = await findActiveRedirect(path);
  if (match) {
    if (match.statusCode === 301) permanentRedirect(match.toPath);
    redirect(match.toPath);
  }

  const referrer = (await headers()).get("referer");
  await recordNotFoundHit(path, referrer);

  notFound();
}
