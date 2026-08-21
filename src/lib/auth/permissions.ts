import { ROLE_PERMISSIONS, type Permission, type Role } from "@/lib/constants";

/**
 * İcazə yoxlaması.
 *
 * Mənbə `constants.ts`-dəki `ROLE_PERMISSIONS` matrisidir — burada ikinci icazə
 * sistemi qurulmur. Bazadakı rol sətri sabitlərdən kənara çıxarsa (məsələn miqrasiya
 * səhvi), nəticə `false` olur: naməlum rol heç nəyə çıxış almır.
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
