import { z } from "zod";

export const createSubscriptionPackageSchema = z.object({
  name: z
    .string()
    .min(1, "Package name is required")
    .max(100, "Package name too long"),
  priceUSD: z
    .number()
    .positive("Price must be positive")
    .min(0.01, "Price must be at least $0.01"),
  projectsPerMonth: z
    .number()
    .int("Projects per month must be a whole number")
    .min(1, "At least 1 project per month"),
  contactClicksPerProject: z
    .number()
    .int("Contact clicks must be a whole number")
    .min(0, "Contact clicks cannot be negative"),
  features: z
    .array(z.string().min(1, "Feature cannot be empty"))
    .min(1, "At least one feature is required"),
  isPopular: z.boolean().optional(),
  active: z.boolean().optional(),
});

export const updateSubscriptionPackageSchema = z.object({
  name: z
    .string()
    .min(1, "Package name is required")
    .max(100, "Package name too long")
    .optional(),
  priceUSD: z
    .number()
    .positive("Price must be positive")
    .min(0.01, "Price must be at least $0.01")
    .optional(),
  projectsPerMonth: z
    .number()
    .int("Projects per month must be a whole number")
    .min(1, "At least 1 project per month")
    .optional(),
  contactClicksPerProject: z
    .number()
    .int("Contact clicks must be a whole number")
    .min(0, "Contact clicks cannot be negative")
    .optional(),
  features: z
    .array(z.string().min(1, "Feature cannot be empty"))
    .min(1, "At least one feature is required")
    .optional(),
  isPopular: z.boolean().optional(),
  active: z.boolean().optional(),
});

export const subscriptionPackageIdParamSchema = z.object({
  id: z.string().length(24, "Invalid subscription package ID"), // MongoDB ObjectId
});

export type CreateSubscriptionPackageInput = z.infer<typeof createSubscriptionPackageSchema>;
export type UpdateSubscriptionPackageInput = z.infer<typeof updateSubscriptionPackageSchema>;
export type SubscriptionPackageIdParam = z.infer<typeof subscriptionPackageIdParamSchema>;
