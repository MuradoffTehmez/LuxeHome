import { NextResponse } from "next/server";
import { ACCOUNT_TYPES, LISTING_ACCOUNT_TYPES } from "@/lib/constants";
import { getOptionalUser } from "@/lib/auth/guard";
import { getUnreadNotificationCount } from "@/lib/queries";

/**
 * Naviqasiyadakı hesab bölməsi üçün sessiya vəziyyəti.
 *
 * Sessiya birbaşa `(site)/layout.tsx` içində oxunsaydı, bütün ictimai səhifələr
 * dinamik olardı və ana səhifənin statik render üstünlüyü itərdi. Ona görə vəziyyət
 * bu yüngül marşrutdan brauzer tərəfdə alınır.
 *
 * Cavabda ad və hesab növündən başqa heç nə yoxdur — e-poçt və rol sızmır.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getOptionalUser();
  const isStaff = user?.accountType === ACCOUNT_TYPES.STAFF;

  const body = user
    ? {
        signedIn: true as const,
        name: user.name,
        isStaff,
        canPostListing: LISTING_ACCOUNT_TYPES.includes(user.accountType),
        // Əməkdaş hesabı üçün mənasızdır — panel öz bildiriş sistemini istifadə etmir.
        unreadNotifications: isStaff ? 0 : await getUnreadNotificationCount(user.id),
      }
    : { signedIn: false as const };

  return NextResponse.json(body, {
    // Sessiya vəziyyəti heç vaxt keşlənməməlidir — paylaşılan keşdə başqasının
    // hesabı görünə bilərdi
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
