// @ts-nocheck
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    errorFormat: 'pretty',
  })

// Add connection error handling
prisma.$connect().catch((error) => {
  console.error('Failed to connect to database:', error);
  if (process.env.NODE_ENV === 'production') {
    // In production, we might want to retry or handle this differently
    process.exit(1);
  }
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
