import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/database/db';

interface Post {
  id: string;
  title: string;
  views: number;
  clicks: number;
  category?: any;
  author?: any;
}

interface PostWithScore extends Post {
  popularityScore: number;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    const limit = parseInt(searchParams.get('limit') || '10');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get posts with views and clicks in the specified period
    const popularPosts = await (prisma as any).post.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: { lte: new Date() },
        OR: [
          { views: { gt: 0 } },
          { clicks: { gt: 0 } }
        ]
      },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: [
        // Calculate popularity score: views*0.7 + clicks*0.3
        { views: 'desc' },
        { clicks: 'desc' }
      ],
      take: limit
    });

    // Calculate popularity score and sort
    const postsWithScore = popularPosts.map((post: Post) => ({
      ...post,
      popularityScore: (post.views * 0.7) + (post.clicks * 0.3)
    }));

    // Sort by popularity score
    postsWithScore.sort((a: PostWithScore, b: PostWithScore) => b.popularityScore - a.popularityScore);

    return NextResponse.json({
      posts: postsWithScore.slice(0, limit)
    });
  } catch (error) {
    console.error('Error fetching popular posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch popular posts' },
      { status: 500 }
    );
  }
}
