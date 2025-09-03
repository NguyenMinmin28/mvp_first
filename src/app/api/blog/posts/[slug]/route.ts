import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/database/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        { error: 'Invalid slug parameter' },
        { status: 400 }
      );
    }

    const post = await (prisma as any).post.findUnique({
      where: { slug },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            bio: true
          }
        },
        comments: {
          where: { status: 'published' },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!post || post.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Validate post data
    if (!post.title || !post.content) {
      return NextResponse.json(
        { error: 'Invalid post data' },
        { status: 500 }
      );
    }

    // Get related posts with error handling
    let relatedPosts: any[] = [];
    try {
      const whereClause: any = {
        status: 'PUBLISHED',
        publishedAt: { lte: new Date() },
        id: { not: post.id }
      };

      // Only add categoryId condition if it exists
      if (post.categoryId) {
        whereClause.OR = [
          { categoryId: post.categoryId },
          { tags: { hasAny: post.tags || [] } }
        ];
      }

      relatedPosts = await (prisma as any).post.findMany({
        where: whereClause,
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
        orderBy: { publishedAt: 'desc' },
        take: 3
      });
    } catch (relatedError) {
      console.error('Error fetching related posts:', relatedError);
      // Continue without related posts rather than failing completely
    }

    // Sanitize and validate the response data
    const sanitizedPost = {
      ...post,
      title: post.title || 'Untitled Post',
      content: post.content || '',
      excerpt: post.excerpt || '',
      tags: Array.isArray(post.tags) ? post.tags : [],
      views: typeof post.views === 'number' ? post.views : 0,
      author: post.author || { id: '', name: 'Unknown Author' },
      category: post.category || null
    };

    const sanitizedRelatedPosts = relatedPosts.map((relatedPost: any) => ({
      id: relatedPost.id,
      slug: relatedPost.slug,
      title: relatedPost.title || 'Untitled Post',
      coverUrl: relatedPost.coverUrl || '',
      category: relatedPost.category,
      publishedAt: relatedPost.publishedAt,
      author: relatedPost.author || { name: 'Unknown Author' }
    }));

    return NextResponse.json({
      post: sanitizedPost,
      relatedPosts: sanitizedRelatedPosts
    });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog post' },
      { status: 500 }
    );
  }
}
