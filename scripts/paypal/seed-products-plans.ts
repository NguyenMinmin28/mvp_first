/**
 * Script to create PayPal products and plans in sandbox/live environment
 * Run with: npx tsx scripts/paypal/seed-products-plans.ts
 */

import { paypalService } from "../../src/modules/paypal/paypal.service";
import { paypalConfig } from "../../src/config/paypal";
import { logger } from "../../src/lib/logger";

interface PayPalProduct {
  name: string;
  description: string;
  type: "SERVICE";
  category: "SOFTWARE";
}

interface PayPalPlan {
  product_id: string;
  name: string;
  description: string;
  billing_cycles: Array<{
    frequency: {
      interval_unit: "MONTH";
      interval_count: 1;
    };
    tenure_type: "REGULAR";
    sequence: number;
    total_cycles: 0; // Infinite
    pricing_scheme: {
      fixed_price: {
        value: string;
        currency_code: "USD";
      };
    };
  }>;
  payment_preferences: {
    auto_bill_outstanding: boolean;
    setup_fee_failure_action: "CONTINUE";
    payment_failure_threshold: 3;
  };
}

const PLANS_CONFIG = [
  {
    name: "Basic Plan",
    description: "Basic subscription for small projects",
    priceUSD: "29.00",
    projectsPerMonth: 2,
    contactClicksPerProject: 3
  },
  {
    name: "Standard Plan", 
    description: "Standard subscription for growing businesses",
    priceUSD: "49.00",
    projectsPerMonth: 5,
    contactClicksPerProject: 5,
    isPopular: true
  },
  {
    name: "Premium Plan",
    description: "Premium subscription for enterprise clients",
    priceUSD: "99.00", 
    projectsPerMonth: 15,
    contactClicksPerProject: 10
  }
];

async function createProduct(productData: PayPalProduct) {
  try {
    logger.info(`Creating PayPal product: ${productData.name}`);
    
    const response = await fetch(`${paypalConfig.baseUrl}/v1/catalogs/products`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${await (paypalService as any).getAccessToken()}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "PayPal-Request-Id": `product-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      },
      body: JSON.stringify(productData)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create product: ${error}`);
    }

    const product = await response.json();
    logger.info(`✅ Created product: ${product.id}`);
    
    return product;
  } catch (error) {
    logger.error(`❌ Failed to create product ${productData.name}`, error as Error);
    throw error;
  }
}

async function createPlan(planData: PayPalPlan) {
  try {
    logger.info(`Creating PayPal plan: ${planData.name}`);
    
    const response = await fetch(`${paypalConfig.baseUrl}/v1/billing/plans`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${await (paypalService as any).getAccessToken()}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "PayPal-Request-Id": `plan-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      },
      body: JSON.stringify(planData)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create plan: ${error}`);
    }

    const plan = await response.json();
    logger.info(`✅ Created plan: ${plan.id}`);
    
    return plan;
  } catch (error) {
    logger.error(`❌ Failed to create plan ${planData.name}`, error as Error);
    throw error;
  }
}

async function main() {
  try {
    logger.info("🚀 Starting PayPal products and plans creation");
    logger.info(`Environment: ${paypalConfig.mode}`);
    logger.info(`Base URL: ${paypalConfig.baseUrl}`);

    // Create main product
    const productData: PayPalProduct = {
      name: "Developer Connect Subscription",
      description: "Monthly subscription for accessing developer talents through our platform",
      type: "SERVICE",
      category: "SOFTWARE"
    };

    const product = await createProduct(productData);

    // Create plans for each pricing tier
    const createdPlans = [];
    
    for (const planConfig of PLANS_CONFIG) {
      const planData: PayPalPlan = {
        product_id: product.id,
        name: planConfig.name,
        description: planConfig.description,
        billing_cycles: [
          {
            frequency: {
              interval_unit: "MONTH",
              interval_count: 1
            },
            tenure_type: "REGULAR",
            sequence: 1,
            total_cycles: 0, // Infinite
            pricing_scheme: {
              fixed_price: {
                value: planConfig.priceUSD,
                currency_code: "USD"
              }
            }
          }
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee_failure_action: "CONTINUE",
          payment_failure_threshold: 3
        }
      };

      const plan = await createPlan(planData);
      createdPlans.push({
        ...plan,
        ...planConfig
      });

      // Wait between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Output results for copying to environment/database
    logger.info("\n🎉 All plans created successfully!");
    logger.info("\n📋 COPY THESE TO YOUR DATABASE:");
    
    console.log("\n--- SQL for Package table ---");
    createdPlans.forEach((plan, index) => {
      console.log(`
INSERT INTO Package (name, priceUSD, projectsPerMonth, contactClicksPerProject, features, isPopular, active, provider, providerPlanId, interval)
VALUES (
  '${plan.name}',
  ${plan.priceUSD},
  ${plan.projectsPerMonth},
  ${plan.contactClicksPerProject},
  '["Project posting", "Developer matching", "Contact reveals"]',
  ${plan.isPopular || false},
  true,
  'paypal',
  '${plan.id}',
  'monthly'
);`);
    });

    console.log("\n--- Environment Variables ---");
    console.log("# Add these to your .env file:");
    createdPlans.forEach((plan, index) => {
      const envKey = plan.name.toUpperCase().replace(/\s+/g, '_');
      console.log(`PAYPAL_PLAN_ID_${envKey}=${plan.id}`);
    });

    logger.info("\n✅ Setup complete!");

  } catch (error) {
    logger.error("❌ Setup failed", error as Error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}
