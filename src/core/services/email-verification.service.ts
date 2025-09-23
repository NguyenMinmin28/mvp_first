import { prisma } from "@/core/database/db";
import { genOtp, sha256 } from "@/core/utils/wa";
import { sendEmailViaResend } from "@/core/services/email.service";
import { renderVerificationEmail } from "@/core/services/email-verification.template";

export interface EmailVerificationResult {
  success: boolean;
  message: string;
  remainingAttempts?: number;
}

export interface EmailVerificationGenerationResult {
  success: boolean;
  code?: string;
  expiresAt?: Date;
  message: string;
}

export class EmailVerificationService {
  private static readonly MAX_ATTEMPTS = 3;
  private static readonly EXPIRY_MINUTES = 10; // Email OTP lasts longer than SMS
  private static readonly RATE_LIMIT_MINUTES = 1; // Minimum time between OTP requests

  /**
   * Generate and store OTP code for email verification
   */
  static async generateEmailOtp(
    email: string
  ): Promise<EmailVerificationGenerationResult> {
    try {
      // Delete any existing OTP for this email first
      await prisma.otpCode.deleteMany({
        where: { email },
      });

      // Check rate limiting (after cleanup)
      const recentOtp = await prisma.otpCode.findFirst({
        where: {
          email,
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
          email,
          hash,
          expiresAt,
          attempts: 0,
        },
      });

      return {
        success: true,
        code,
        expiresAt,
        message: "Email verification code generated successfully",
      };
    } catch (error) {
      console.error("Error generating email OTP:", error);
      return {
        success: false,
        message:
          (error as any)?.message || "Failed to generate verification code",
      };
    }
  }

  /**
   * Verify OTP code for email
   */
  static async verifyEmailOtp(
    email: string,
    code: string
  ): Promise<EmailVerificationResult> {
    try {
      const otpRecord = await prisma.otpCode.findFirst({
        where: { email },
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
          message: "Email verification successful",
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
      console.error("Error verifying email OTP:", error);
      return {
        success: false,
        message: "Failed to verify code",
      };
    }
  }

  /**
   * Send verification email (placeholder - integrate with your email service)
   */
  static async sendVerificationEmail(
    email: string,
    code: string
  ): Promise<boolean> {
    try {
      const html = renderVerificationEmail(code);
      const result = await sendEmailViaResend({
        from: process.env.RESEND_FROM,
        to: email,
        subject: "Verify your email",
        html,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to send email");
      }

      return true;
    } catch (error) {
      console.error("Error sending verification email:", error);
      return false;
    }
  }
}
