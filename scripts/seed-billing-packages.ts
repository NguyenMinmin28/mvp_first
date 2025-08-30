// @ts-nocheck
import { prisma } from "@/core/database/db";

async function seedBillingPackages() {
  try {
    console.log("🌱 Seeding billing packages...");

    // Define the packages according to the documentation model
    const packages = [
      {
        name: "Basic",
        priceUSD: 29.99,
        projectsPerMonth: 3,
        contactClicksPerProject: 2,
        features: [
          "3 projects per month",
          "2 contact reveals per project",
          "Basic support",
          "48-hour response time"
        ],
        isPopular: false,
        provider: "paypal" as const,
        providerPlanId: "BASIC_PLAN_ID", // Replace with actual PayPal plan ID
        interval: "monthly",
        trialPeriodDays: 7,
        trialProjectsCount: 1,
      },
      {
        name: "Standard",
        priceUSD: 59.99,
        projectsPerMonth: 10,
        contactClicksPerProject: 5,
        features: [
          "10 projects per month",
          "5 contact reveals per project",
          "Priority support",
          "24-hour response time",
          "Advanced matching algorithm"
        ],
        isPopular: true,
        provider: "paypal" as const,
        providerPlanId: "STANDARD_PLAN_ID", // Replace with actual PayPal plan ID
        interval: "monthly",
        trialPeriodDays: 14,
        trialProjectsCount: 2,
      },
      {
        name: "Premium",
        priceUSD: 99.99,
        projectsPerMonth: 25,
        contactClicksPerProject: 10,
        features: [
          "25 projects per month",
          "10 contact reveals per project",
          "Dedicated support",
          "12-hour response time",
          "Advanced matching algorithm",
          "Custom requirements",
          "Priority developer pool"
        ],
        isPopular: false,
        provider: "paypal" as const,
        providerPlanId: "PREMIUM_PLAN_ID", // Replace with actual PayPal plan ID
        interval: "monthly",
        trialPeriodDays: 14,
        trialProjectsCount: 3,
      },
    ];

    // Upsert packages (create or update)
    for (const pkg of packages) {
      const result = await prisma.package.upsert({
        where: {
          name: pkg.name,
        },
        update: {
          ...pkg,
          updatedAt: new Date(),
        },
        create: pkg,
      });

      console.log(`✅ Package "${result.name}" - $${result.priceUSD}/month`);
    }

    console.log("🎉 Billing packages seeded successfully!");

  } catch (error) {
    console.error("❌ Error seeding billing packages:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedBillingPackages();
