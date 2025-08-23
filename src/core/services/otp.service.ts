import { prisma } from "@/core/database/db";
import { genOtp, sha256 } from "@/core/utils/wa";

export interface OtpResult {
  success: boolean;
  message: string;
  remainingAttempts?: number;
}

export interface OtpGenerationResult {
  success: boolean;
  code?: string;
  expiresAt?: Date;
  message: string;
}

export class OtpService {
  private static readonly MAX_ATTEMPTS = 3;
  private static readonly EXPIRY_MINUTES = 5;
  private static readonly RATE_LIMIT_MINUTES = 1; // Minimum time between OTP requests

  /**
   * Generate and store OTP code for phone number
   */
  static async generateOtp(phoneE164: string): Promise<OtpGenerationResult> {
    try {
      // Delete any existing OTP for this phone number first
      await prisma.otpCode.deleteMany({
        where: { phoneE164 },
      });

      // Check rate limiting (after cleanup)
      const recentOtp = await prisma.otpCode.findFirst({
        where: {
          phoneE164,
          createdAt: {
            gte: new Date(Date.now() - this.RATE_LIMIT_MINUTES * 60 * 1000),
          },
        },
        orderBy: { createdAt: "desc" },
      });

      if (recentOtp) {
        return {
          success: false,
          message: `Please wait ${this.RATE_LIMIT_MINUTES} minute(s) before requesting a new code`,
        };
      }

      // Generate new OTP
      const code = genOtp(6);
      const hash = sha256(code);
      const expiresAt = new Date(Date.now() + this.EXPIRY_MINUTES * 60 * 1000);

      // Store new OTP
      await prisma.otpCode.create({
        data: {
          phoneE164,
          hash,
          expiresAt,
          attempts: 0,
        },
      });

      return {
        success: true,
        code,
        expiresAt,
        message: "OTP generated successfully",
      };
    } catch (error) {
      console.error("Error generating OTP:", error);
      return {
        success: false,
        message: "Failed to generate OTP",
      };
    }
  }

  /**
   * Verify OTP code for phone number
   */
  static async verifyOtp(phoneE164: string, code: string): Promise<OtpResult> {
    try {
      const otpRecord = await prisma.otpCode.findFirst({
        where: { phoneE164 },
        orderBy: { createdAt: "desc" },
      });

      if (!otpRecord) {
        return {
          success: false,
          message: "No verification code found. Please request a new one.",
        };
      }

      // Check if expired
      if (otpRecord.expiresAt < new Date()) {
        await prisma.otpCode.delete({
          where: { id: otpRecord.id },
        });
        return {
          success: false,
          message: "Verification code has expired. Please request a new one.",
        };
      }

      // Check max attempts
      if (otpRecord.attempts >= this.MAX_ATTEMPTS) {
        await prisma.otpCode.delete({
          where: { id: otpRecord.id },
        });
        return {
          success: false,
          message:
            "Maximum verification attempts exceeded. Please request a new code.",
        };
      }

      // Verify code
      const codeHash = sha256(code);
      const isValid = otpRecord.hash === codeHash;

      if (isValid) {
        // Delete successful OTP
        await prisma.otpCode.delete({
          where: { id: otpRecord.id },
        });
        return {
          success: true,
          message: "Verification successful",
        };
      } else {
        // Increment attempts
        await prisma.otpCode.update({
          where: { id: otpRecord.id },
          data: { attempts: otpRecord.attempts + 1 },
        });

        const remainingAttempts = this.MAX_ATTEMPTS - (otpRecord.attempts + 1);
        return {
          success: false,
          message: `Invalid verification code. ${remainingAttempts} attempts remaining.`,
          remainingAttempts,
        };
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      return {
        success: false,
        message: "Failed to verify code",
      };
    }
  }

  /**
   * Clean up expired OTP codes (should be run periodically)
   */
  static async cleanupExpiredOtps(): Promise<number> {
    try {
      const result = await prisma.otpCode.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      console.log(`Cleaned up ${result.count} expired OTP codes`);
      return result.count;
    } catch (error) {
      console.error("Error cleaning up expired OTPs:", error);
      return 0;
    }
  }

  /**
   * Get OTP statistics for monitoring
   */
  static async getOtpStats(): Promise<{
    totalActive: number;
    expiredCount: number;
    highAttemptCount: number;
  }> {
    try {
      const [totalActive, expiredCount, highAttemptCount] = await Promise.all([
        prisma.otpCode.count({
          where: {
            expiresAt: {
              gte: new Date(),
            },
          },
        }),
        prisma.otpCode.count({
          where: {
            expiresAt: {
              lt: new Date(),
            },
          },
        }),
        prisma.otpCode.count({
          where: {
            attempts: {
              gte: this.MAX_ATTEMPTS - 1,
            },
          },
        }),
      ]);

      return {
        totalActive,
        expiredCount,
        highAttemptCount,
      };
    } catch (error) {
      console.error("Error getting OTP stats:", error);
      return {
        totalActive: 0,
        expiredCount: 0,
        highAttemptCount: 0,
      };
    }
  }
}
