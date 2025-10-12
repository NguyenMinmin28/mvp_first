// @ts-nocheck
import { prisma } from "@/core/database/db";

async function seedBillingPackages() {
  try {
    console.log("🌱 Seeding billing packages...");

    // Define the packages according to the new pricing structure
    const packages = [
      {
        name: "Free Plan",
        priceUSD: 0,
        projectsPerMonth: 999, // Unlimited projects
        contactClicksPerProject: 0, // Not used for connects model
        connectsPerMonth: 25, // Total connects (not monthly)
        features: [
          "25 connects total",
          "Post unlimited projects",
          "Contact developers with connects",
          "Get notified when freelancers show interest"
        ],
        isPopular: false,
        provider: "paypal" as const,
        providerPlanId: "P-FREE-PLAN-ID", // Replace with actual PayPal plan ID
        interval: "monthly",
        trialPeriodDays: 0,
        trialProjectsCount: 0,
      },
      {
        name: "Plus Plan",
        priceUSD: 19.95,
        projectsPerMonth: 999, // Unlimited projects
        contactClicksPerProject: 0, // Not used for connects model
        connectsPerMonth: 999, // Unlimited connects
        features: [
          "Unlimited connects",
          "Unlimited projects",
          "Contact developers with connects",
          "Get notified when freelancers show interest"
        ],
        isPopular: true,
        provider: "paypal" as const,
        providerPlanId: "P-2L869865T2585332XNC24EXA", // Existing PayPal plan ID
        interval: "monthly",
        trialPeriodDays: 7,
        trialProjectsCount: 1,
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
