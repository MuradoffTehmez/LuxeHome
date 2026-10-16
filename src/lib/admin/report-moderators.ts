import { ACCOUNT_TYPES, PERMISSIONS, ROLE_PERMISSIONS, type Role } from "@/lib/constants";

/**
 * Şikayət təyin edilə bilən moderatorlar (#195): `property:manage` icazəsi olan rolların
 * aktiv əməkdaşları. Rol siyahısı `ROLE_PERMISSIONS`-dən qurulur — matris dəyişəndə seçim
 * siyahısı və serverdəki yoxlama birlikdə dəyişsin.
 */
export function reportModeratorWhere() {
  const roles = (Object.keys(ROLE_PERMISSIONS) as Role[]).filter((role) =>
    ROLE_PERMISSIONS[role].includes(PERMISSIONS.PROPERTY_MANAGE));
  return { accountType: ACCOUNT_TYPES.STAFF, isActive: true, role: { in: roles } };
}
