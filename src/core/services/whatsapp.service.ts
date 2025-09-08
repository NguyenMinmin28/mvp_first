import axios, { AxiosError } from "axios";

export interface WhatsAppMessage {
  messaging_product: "whatsapp";
  to: string;
  type: "template" | "text";
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: {
      type: string;
      sub_type?: string;
      index?: string;
      parameters: {
        type: string;
        text: string;
      }[];
    }[];
  };
  text?: {
    body: string;
  };
}

export interface WhatsAppResponse {
  messaging_product: string;
  contacts: {
    input: string;
    wa_id: string;
  }[];
  messages: {
    id: string;
  }[];
}

export interface WhatsAppError {
  error: {
    message: string;
    type: string;
    code: number;
    error_data?: {
      messaging_product: string;
      details: string;
    };
    error_subcode?: number;
    fbtrace_id: string;
  };
}

export class WhatsAppService {
  private readonly accessToken: string;
  private readonly phoneNumberId: string;
  private readonly apiVersion = "v19.0";
  private readonly baseUrl = `https://graph.facebook.com/${this.apiVersion}`;

  constructor(accessToken: string, phoneNumberId: string) {
    this.accessToken = accessToken;
    this.phoneNumberId = phoneNumberId;
  }

  /**
   * Gửi template message cho verification code
   */
  async sendVerificationCode(
    phoneNumber: string,
    code: string
  ): Promise<WhatsAppResponse> {
    const message: WhatsAppMessage = {
      messaging_product: "whatsapp",
      to: WhatsAppService.formatPhoneForWhatsApp(phoneNumber),
      type: "template",
      template: {
        name: process.env.WHATSAPP_TEMPLATE_NAME || "otp_verification",
        language: { code: "en_US" }, // hoặc en_US / vi ... đúng với template đã duyệt
        components: [
          // {{1}} trong body
          { type: "body", parameters: [{ type: "text", text: code }] },

          // {{1}} trong URL button index 0
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [
              { type: "text", text: code }, // hoặc token/magic string bạn muốn gắn vào URL
            ],
          },
        ],
      },
    };

    return this.sendMessage(message);
  }

  /**
   * Gửi text message đơn giản (chỉ cho testing)
   */
  async sendTextMessage(
    phoneNumber: string,
    text: string
  ): Promise<WhatsAppResponse> {
    const message: WhatsAppMessage = {
      messaging_product: "whatsapp",
      to: WhatsAppService.formatPhoneForWhatsApp(phoneNumber),
      type: "text",
      text: {
        body: text,
      },
    };

    return this.sendMessage(message);
  }

  /**
   * Gửi template message qua WhatsApp
   */
  async sendTemplateMessage(
    phoneNumber: string,
    templateName: string,
    parameters: string[],
    buttons?: Array<{ id: string; title: string; payload: string }>
  ): Promise<WhatsAppResponse> {
    const components: any[] = [];
    
    // Add body parameters if any
    if (parameters.length > 0) {
      components.push({
        type: "body",
        parameters: parameters.map(param => ({
          type: "text",
          text: param
        }))
      });
    }
    
    // Add interactive buttons if provided
    if (buttons && buttons.length > 0) {
      components.push({
        type: "button",
        sub_type: "quick_reply",
        index: "0",
        parameters: buttons.map(button => ({
          type: "payload",
          payload: button.payload
        }))
      });
    }

    const message: WhatsAppMessage = {
      messaging_product: "whatsapp",
      to: WhatsAppService.formatPhoneForWhatsApp(phoneNumber),
      type: "template",
      template: {
        name: templateName,
        language: { code: "en" },
        components: components.length > 0 ? components : undefined
      }
    };

    return this.sendMessage(message);
  }

  /**
   * Gửi message qua WhatsApp Business API
   */
  private async sendMessage(
    message: WhatsAppMessage
  ): Promise<WhatsAppResponse> {
    try {
      const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
      console.log("Sending message to WhatsApp:", url);
      console.log("Message:", message);
      console.log("AccessToken:", this.accessToken);
      console.log("PhoneNumberId:", this.phoneNumberId);
      console.log("BaseUrl:", this.baseUrl);
      console.log("ApiVersion:", this.apiVersion);
      console.log("Headers:", {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      });
      console.log("Timeout:", 10000);
      const response = await axios.post(url, message, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 seconds timeout
      });

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        const whatsappError = error.response?.data as WhatsAppError;

        console.error("WhatsApp API Error:", {
          status: error.response?.status,
          message: whatsappError?.error?.message,
          type: whatsappError?.error?.type,
          code: whatsappError?.error?.code,
          details: whatsappError?.error?.error_data?.details,
        });

        throw new Error(
          whatsappError?.error?.message ||
            `WhatsApp API Error: ${error.response?.status}`
        );
      }

      console.error("Unexpected error:", error);
      throw new Error("Failed to send WhatsApp message");
    }
  }

  /**
   * Verify webhook signature (for webhook endpoint)
   */
  static verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    const crypto = require("crypto");
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(`sha256=${expectedSignature}`)
    );
  }

  /**
   * Validate phone number format (E.164)
   */
  static validatePhoneNumber(phoneNumber: string): boolean {
    // E.164 format: +[country code][number]
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * Format phone number to E.164 if needed
   */
  static formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digits
    const digits = phoneNumber.replace(/\D/g, "");

    // If starts with country code, add +
    if (digits.length >= 10) {
      // Assume Vietnam if no country code
      if (digits.startsWith("0")) {
        return `+84${digits.substring(1)}`;
      }

      // Add + if not present
      if (!phoneNumber.startsWith("+")) {
        return `+${digits}`;
      }
    }

    return phoneNumber;
  }

  /**
   * Format phone number for WhatsApp API (remove + for sending)
   */
  static formatPhoneForWhatsApp(phoneNumber: string): string {
    // Remove + for WhatsApp API
    return phoneNumber.replace(/^\+/, "");
  }
}

// Singleton instance
let whatsappServiceInstance: WhatsAppService | null = null;

export function getWhatsAppService(): WhatsAppService {
  if (!whatsappServiceInstance) {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!accessToken || !phoneNumberId) {
      // In development mode, we can work without WhatsApp credentials
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "WhatsApp API credentials not configured - running in demo mode"
        );
        // Return a mock service for development
        whatsappServiceInstance = new WhatsAppService(
          "demo-token",
          "demo-phone-id"
        );
      } else {
        throw new Error("WhatsApp API credentials not configured");
      }
    } else {
      whatsappServiceInstance = new WhatsAppService(accessToken, phoneNumberId);
    }
  }

  return whatsappServiceInstance;
}
