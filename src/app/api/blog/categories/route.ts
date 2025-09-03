import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/database/db';

export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        color: true,
        _count: {
          select: {
            posts: {
              where: {
                status: 'PUBLISHED',
                publishedAt: { lte: new Date() }
              }
            }
          }
        }
      }
    });

    // Filter out categories with no published posts
    const activeCategories = categories.filter(cat => cat._count.posts > 0);

    return NextResponse.json({
      categories: activeCategories.map(({ _count, ...category }) => ({
        ...category,
        postCount: _count.posts
      }))
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
