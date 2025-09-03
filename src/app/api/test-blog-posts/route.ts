import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/database/db";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Test API: Fetching blog posts...");
    
    // Fetch all blog posts without authentication check
    const posts = await (prisma as any).post.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            bio: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log("🔍 Test API: Found posts:", posts.length);

    return NextResponse.json({
      success: true,
      count: posts.length,
      posts: posts.map((post: any) => ({
        id: post.id,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        slug: post.slug,
        category: "Uncategorized",
        categoryId: post.categoryId,
        status: post.status,
        publishedAt: post.publishedAt,
        author: post.author,

        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        isFeatured: post.isFeatured,
        views: post.views,
        clicks: post.clicks,
      })),
    });
  } catch (error) {
    console.error("❌ Test API Error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
