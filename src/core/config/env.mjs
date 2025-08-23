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
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().min(1),
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

    // Client
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
});
