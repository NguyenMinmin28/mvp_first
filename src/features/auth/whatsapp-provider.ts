import QRCode from "qrcode";

export interface WhatsAppCredentials {
  phoneNumber: string;
  verificationCode: string;
}

export interface WhatsAppProfile {
  id: string;
  name: string;
  phoneNumber: string;
  profilePicture?: string;
}

export class WhatsAppProvider {
  id = "whatsapp";
  name = "WhatsApp";
  type = "credentials" as const;

  async authorize(credentials: WhatsAppCredentials) {
    try {
      // Trong thực tế, bạn sẽ gửi SMS verification code đến số điện thoại
      // và xác thực code đó. Ở đây tôi sẽ mô phỏng quá trình này.

      if (!credentials.phoneNumber || !credentials.verificationCode) {
        return null;
      }

      // Mô phỏng xác thực verification code
      // Trong production, bạn sẽ kiểm tra code với database hoặc service
      if (credentials.verificationCode === "123456") {
        return {
          id: `whatsapp_${credentials.phoneNumber}`,
          name: `User ${credentials.phoneNumber}`,
          email: `${credentials.phoneNumber}@whatsapp.local`,
          phoneNumber: credentials.phoneNumber,
          image: undefined,
        };
      }

      return null;
    } catch (error) {
      console.error("WhatsApp authentication error:", error);
      return null;
    }
  }

  async generateQRCode(data: string): Promise<string> {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(data, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      return qrCodeDataURL;
    } catch (error) {
      console.error("Error generating QR code:", error);
      throw new Error("Failed to generate QR code");
    }
  }
}

export const whatsappProvider = new WhatsAppProvider();
