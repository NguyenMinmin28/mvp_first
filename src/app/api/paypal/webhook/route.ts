import { NextRequest } from "next/server";
import { handlePayPalWebhook } from "@/modules/paypal/paypal.controller";

/**
 * PayPal webhook endpoint - delegates to controller
 */
export async function POST(request: NextRequest) {
  return handlePayPalWebhook(request);
}