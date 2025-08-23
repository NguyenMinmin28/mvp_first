import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/core/database/db";
import { z } from "zod";
import {
  ApiError,
  ApiResponse,
  handleApiError,
} from "@/core/utils/error-handler";

const googleSignUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  image: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input data
    const validationResult = googleSignUpSchema.safeParse(body);
    if (!validationResult.success) {
      throw new ApiError(
        "Validation failed",
        400,
        validationResult.error.issues
      );
    }

    const { email, name, image } = validationResult.data;

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ApiError("Email already in use", 409);
    }

    // Create user with Google account
    const user = await db.user.create({
      data: {
        name,
        email,
        image,
        emailVerified: new Date(), // Google accounts are pre-verified
        isProfileCompleted: false, // User needs to complete profile
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        isProfileCompleted: true,
      },
    });

    const response: ApiResponse = {
      success: true,
      data: user,
      message: "Google account registered successfully",
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
