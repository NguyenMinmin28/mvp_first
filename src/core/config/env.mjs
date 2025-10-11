import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    // WhatsApp Business API (optional in development)
    WHATSAPP_ACCESS_TOKEN: z.string().min(1).optional(),
    WHATSAPP_PHONE_NUMBER_ID: z.string().min(1).optional(),
    WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().min(1).optional(),
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().min(1).optional(),

    // Database
    DATABASE_URL: z.string().min(1),

    // NextAuth
    NEXTAUTH_SECRET: z.string().min(1),
    NEXTAUTH_URL: z.string().url(),

    // Google OAuth
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),

    // PayPal
    PAYPAL_CLIENT_ID: z.string().min(1),
    PAYPAL_CLIENT_SECRET: z.string().min(1),
    PAYPAL_WEBHOOK_ID: z.string().min(1),
    PAYPAL_MODE: z.enum(["sandbox", "live"]).default("sandbox"),

    // Cloudinary (server-side for signed uploads)
    CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
    CLOUDINARY_API_KEY: z.string().min(1).optional(),
    CLOUDINARY_API_SECRET: z.string().min(1).optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().min(1),
    NEXT_PUBLIC_PAYPAL_CLIENT_ID: z.string().min(1).optional(),
    // Cloudinary (optional but recommended for avatar uploads)
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
    NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: z.string().min(1).optional(),
  },
  runtimeEnv: {
    // Server
    WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
    WHATSAPP_BUSINESS_ACCOUNT_ID: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
    WHATSAPP_TEMPLATE_NAME: process.env.WHATSAPP_TEMPLATE_NAME,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
    PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET,
    PAYPAL_WEBHOOK_ID: process.env.PAYPAL_WEBHOOK_ID,
    PAYPAL_MODE: process.env.PAYPAL_MODE,

    // Cloudinary
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

    // Client
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_PAYPAL_CLIENT_ID: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
  },
});
