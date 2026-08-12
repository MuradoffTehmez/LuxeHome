import { PrismaClient } from "@prisma/client";

/**
 * Development-də hot reload zamanı hər dəfə yeni PrismaClient yaradılmasının
 * qarşısını alır (bağlantı sızmasının qarşısı).
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
