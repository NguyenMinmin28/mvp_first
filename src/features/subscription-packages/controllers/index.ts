import { Context } from "hono";
import { zValidator } from "@hono/zod-validator";

import {
  createSubscriptionPackageSchema,
  updateSubscriptionPackageSchema,
  subscriptionPackageIdParamSchema,
} from "@/features/subscription-packages/schemas/subscription-package.schema";
import {
  getAllSubscriptionPackages,
  getSubscriptionPackageById,
  getActiveSubscriptionPackages,
  getPopularSubscriptionPackages,
  createSubscriptionPackage,
  updateSubscriptionPackage,
  deleteSubscriptionPackage,
  toggleSubscriptionPackageActive,
  toggleSubscriptionPackagePopular,
  getSubscriptionPackageStats,
} from "@/features/subscription-packages/controllers/service";

// Define context type for type safety
type Variables = {
  user: { id: string };
  userId: string;
};

type SubscriptionPackageContext = Context<{ Variables: Variables }>;

// GET /api/subscription-packages - Get all subscription packages
export const getAllSubscriptionPackagesHandler = async (c: SubscriptionPackageContext) => {
  try {
    const { active, isPopular, minPrice, maxPrice, sortBy, sortOrder } = c.req.query();
    
    const filters = {
      active: active ? active === 'true' : undefined,
      isPopular: isPopular ? isPopular === 'true' : undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    };

    const sort = sortBy && sortOrder ? {
      field: sortBy as any,
      order: sortOrder as 'asc' | 'desc'
    } : undefined;

    const packages = await getAllSubscriptionPackages(filters, sort);
    return c.json({ success: true, data: packages });
  } catch (error) {
    console.error("Error fetching subscription packages:", error);
    return c.json({ error: "Failed to fetch subscription packages" }, 500);
  }
};

// GET /api/subscription-packages/active - Get active subscription packages
export const getActiveSubscriptionPackagesHandler = async (c: SubscriptionPackageContext) => {
  try {
    const packages = await getActiveSubscriptionPackages();
    return c.json({ success: true, data: packages });
  } catch (error) {
    console.error("Error fetching active subscription packages:", error);
    return c.json({ error: "Failed to fetch active subscription packages" }, 500);
  }
};

// GET /api/subscription-packages/popular - Get popular subscription packages
export const getPopularSubscriptionPackagesHandler = async (c: SubscriptionPackageContext) => {
  try {
    const packages = await getPopularSubscriptionPackages();
    return c.json({ success: true, data: packages });
  } catch (error) {
    console.error("Error fetching popular subscription packages:", error);
    return c.json({ error: "Failed to fetch popular subscription packages" }, 500);
  }
};

// POST /api/subscription-packages - Create new subscription package
export const createSubscriptionPackageHandler = [
  zValidator("json", createSubscriptionPackageSchema),
  async (c: any) => {
    try {
      const data = c.req.valid("json");
      console.log("Creating subscription package:", data);
      
      const package_ = await createSubscriptionPackage(data);
      return c.json({ success: true, data: package_ });
    } catch (error) {
      console.error("Error creating subscription package:", error);
      return c.json({ error: "Failed to create subscription package" }, 500);
    }
  },
];

// GET /api/subscription-packages/:id - Get specific subscription package
export const getSubscriptionPackageByIdHandler = async (c: SubscriptionPackageContext) => {
  try {
    const id = c.req.param("id");
    const package_ = await getSubscriptionPackageById(id);

    if (!package_) {
      return c.json({ error: "Subscription package not found" }, 404);
    }

    return c.json({ success: true, data: package_ });
  } catch (error) {
    console.error("Error fetching subscription package:", error);
    return c.json({ error: "Failed to fetch subscription package" }, 500);
  }
};

// PATCH /api/subscription-packages/:id - Update subscription package
export const updateSubscriptionPackageHandler = [
  zValidator("json", updateSubscriptionPackageSchema),
  async (c: any) => {
    try {
      const id = c.req.param("id");
      const data = c.req.valid("json");

      const package_ = await updateSubscriptionPackage(id, data);
      return c.json({ success: true, data: package_ });
    } catch (error) {
      console.error("Error updating subscription package:", error);
      return c.json({ error: "Failed to update subscription package" }, 500);
    }
  },
];

// DELETE /api/subscription-packages/:id - Delete subscription package
export const deleteSubscriptionPackageHandler = async (c: SubscriptionPackageContext) => {
  try {
    const id = c.req.param("id");
    await deleteSubscriptionPackage(id);
    return c.json({ success: true, message: "Subscription package deleted successfully" });
  } catch (error) {
    console.error("Error deleting subscription package:", error);
    return c.json({ error: "Failed to delete subscription package" }, 500);
  }
};

// POST /api/subscription-packages/:id/toggle-active - Toggle subscription package active status
export const toggleSubscriptionPackageActiveHandler = async (c: SubscriptionPackageContext) => {
  try {
    const id = c.req.param("id");
    const package_ = await toggleSubscriptionPackageActive(id);
    return c.json({ success: true, data: package_ });
  } catch (error) {
    console.error("Error toggling subscription package active status:", error);
    return c.json({ error: "Failed to toggle subscription package active status" }, 500);
  }
};

// POST /api/subscription-packages/:id/toggle-popular - Toggle subscription package popular status
export const toggleSubscriptionPackagePopularHandler = async (c: SubscriptionPackageContext) => {
  try {
    const id = c.req.param("id");
    const package_ = await toggleSubscriptionPackagePopular(id);
    return c.json({ success: true, data: package_ });
  } catch (error) {
    console.error("Error toggling subscription package popular status:", error);
    return c.json({ error: "Failed to toggle subscription package popular status" }, 500);
  }
};

// GET /api/subscription-packages/stats - Get subscription package statistics
export const getSubscriptionPackageStatsHandler = async (c: SubscriptionPackageContext) => {
  try {
    const stats = await getSubscriptionPackageStats();
    return c.json({ success: true, data: stats });
  } catch (error) {
    console.error("Error fetching subscription package stats:", error);
    return c.json({ error: "Failed to fetch subscription package stats" }, 500);
  }
};
