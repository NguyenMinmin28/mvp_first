import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/core/database/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

const signUpSchema = z.object({
  name: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = signUpSchema.parse(body);

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email đã được sử dụng" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        emailVerified: new Date(), // Auto-verify for now, you can add email verification later
      },
      select: {
        id: true,
        name: true,
        email: true,
        isProfileCompleted: true,
      },
    });

    return NextResponse.json({
      success: true,
      user,
      message: "Tài khoản đã được tạo thành công",
    });
  } catch (error) {
    console.error("Sign up error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Có lỗi xảy ra khi tạo tài khoản" },
      { status: 500 }
    );
  }
}
