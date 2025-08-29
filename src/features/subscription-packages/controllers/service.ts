import { prisma as db } from "@/core/database/db";
import type { Prisma } from "@prisma/client";

export async function getAllSubscriptionPackages(
  filters?: { active?: boolean; isPopular?: boolean; minPrice?: number; maxPrice?: number },
  sort?: { field: keyof Prisma.PackageOrderByWithRelationInput; order: "asc" | "desc" }
) {
  return db.package.findMany({
    where: {
      ...(filters?.active !== undefined ? { active: filters.active } : {}),
      ...(filters?.isPopular !== undefined ? { isPopular: filters.isPopular } : {}),
      ...(filters?.minPrice !== undefined || filters?.maxPrice !== undefined
        ? {
            priceUSD: {
              ...(filters?.minPrice !== undefined ? { gte: filters.minPrice } : {}),
              ...(filters?.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
            },
          }
        : {}),
    },
    orderBy: sort ? { [sort.field]: sort.order } : { createdAt: "desc" },
  });
}

export async function getSubscriptionPackageById(id: string) {
  return db.package.findUnique({ where: { id } });
}

export async function getActiveSubscriptionPackages() {
  return db.package.findMany({ where: { active: true } });
}

export async function getPopularSubscriptionPackages() {
  return db.package.findMany({ where: { isPopular: true, active: true } });
}

export async function createSubscriptionPackage(data: {
  name: string;
  priceUSD: number;
  projectsPerMonth: number;
  contactClicksPerProject: number;
  features: string[];
  isPopular?: boolean;
  interval?: string;
  trialPeriodDays?: number | null;
  trialProjectsCount?: number | null;
}) {
  return db.package.create({
    data: {
      name: data.name,
      priceUSD: data.priceUSD,
      projectsPerMonth: data.projectsPerMonth,
      contactClicksPerProject: data.contactClicksPerProject,
      features: data.features,
      isPopular: data.isPopular ?? false,
      interval: data.interval ?? "monthly",
      trialPeriodDays: data.trialPeriodDays ?? 0,
      trialProjectsCount: data.trialProjectsCount ?? 1,
    },
  });
}

export async function updateSubscriptionPackage(id: string, data: Partial<Parameters<typeof createSubscriptionPackage>[0]>) {
  return db.package.update({
    where: { id },
    data: data as any,
  });
}

export async function deleteSubscriptionPackage(id: string) {
  return db.package.delete({ where: { id } });
}

export async function toggleSubscriptionPackageActive(id: string) {
  const pkg = await db.package.findUnique({ where: { id } });
  if (!pkg) return null;
  return db.package.update({ where: { id }, data: { active: !pkg.active } });
}

export async function toggleSubscriptionPackagePopular(id: string) {
  const pkg = await db.package.findUnique({ where: { id } });
  if (!pkg) return null;
  return db.package.update({ where: { id }, data: { isPopular: !pkg.isPopular } });
}

export async function getSubscriptionPackageStats() {
  const [total, active, popular] = await Promise.all([
    db.package.count(),
    db.package.count({ where: { active: true } }),
    db.package.count({ where: { isPopular: true } }),
  ]);
  return { total, active, popular };
}


