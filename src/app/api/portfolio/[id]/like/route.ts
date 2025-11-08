import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/database/db";
import { getServerSessionUser } from "@/features/auth/auth-server";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getServerSessionUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const portfolioId = params.id;
    console.log('Portfolio Like API called:', { userId: user.id, portfolioId });

    // Fetch portfolio and its developer to prevent self-like
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
      include: { developer: { select: { userId: true } } },
    });

    if (!portfolio) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
    }

    if (portfolio.developer.userId === user.id) {
      return NextResponse.json({ error: "You cannot like your own portfolio" }, { status: 400 });
    }

    // Toggle like using PortfolioLike model
    const existing = await prisma.portfolioLike.findUnique({
      where: {
        userId_portfolioId: { userId: user.id, portfolioId },
      },
    });

    let liked = false;
    if (existing) {
      console.log('Removing like...');
      await prisma.portfolioLike.delete({ where: { id: existing.id } });
      liked = false;
    } else {
      console.log('Adding like...');
      await prisma.portfolioLike.create({
        data: { userId: user.id, portfolioId },
      });
      liked = true;
    }

    // Get updated like count
    const likeCount = await prisma.portfolioLike.count({
      where: { portfolioId },
    });

    return NextResponse.json({ 
      liked, 
      likeCount,
      message: liked ? "Portfolio liked" : "Portfolio unliked"
    });
  } catch (error) {
    console.error("Error toggling portfolio like:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET - Check if portfolio is liked by current user
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getServerSessionUser();
    if (!user?.id) {
      return NextResponse.json({ liked: false, likeCount: 0 });
    }

    const portfolioId = params.id;

    const existing = await prisma.portfolioLike.findUnique({
      where: {
        userId_portfolioId: { userId: user.id, portfolioId },
      },
    });

    const likeCount = await prisma.portfolioLike.count({
      where: { portfolioId },
    });

    return NextResponse.json({ 
      liked: !!existing, 
      likeCount 
    });
  } catch (error) {
    console.error("Error checking portfolio like:", error);
    return NextResponse.json({ liked: false, likeCount: 0 });
  }
}

