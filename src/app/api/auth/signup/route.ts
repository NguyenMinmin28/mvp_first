import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/core/database/db";
import { z } from "zod";
import bcrypt from "bcryptjs";
import {
  ApiError,
  ApiResponse,
  handleApiError,
} from "@/core/utils/error-handler";

const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input data
    const validationResult = signUpSchema.safeParse(body);
    if (!validationResult.success) {
      throw new ApiError(
        "Validation failed",
        400,
        validationResult.error.issues
      );
    }

    const { email, password } = validationResult.data;

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ApiError("Email already in use", 409);
    }

    // If password is provided, hash it
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 12);
    }

    // Create user and assign Basic Plan in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          emailVerified: new Date(), // Email is verified after OTP verification
        },
        select: {
          id: true,
          email: true,
          isProfileCompleted: true,
        },
      });

      // Create client profile
      const clientProfile = await tx.clientProfile.create({
        data: {
          userId: user.id,
        },
      });

      // Tìm Basic Plan package
      const basicPackage = await tx.package.findFirst({
        where: {
          name: "Free Plan",
          priceUSD: 0,
        },
      });

      // Nếu có Basic Plan, tạo subscription
      if (basicPackage) {
        await tx.subscription.create({
          data: {
            clientId: clientProfile.id,
            packageId: basicPackage.id,
            status: "active",
            provider: "paypal",
            providerSubscriptionId: `basic-${user.id}-${Date.now()}`,
            startAt: new Date(),
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            cancelAtPeriodEnd: false,
            trialStart: null,
            trialEnd: null,
          },
        });
      }

      return user;
    });

    const response: ApiResponse = {
      success: true,
      data: result,
      message: "Account created successfully with Basic Plan access",
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    const serverError = handleApiError(error);

    const response: ApiResponse = {
      success: false,
      error: serverError.error,
      details: serverError.details,
    };

    return NextResponse.json(response, {
      status: serverError.status || 500,
    });
  }
}
