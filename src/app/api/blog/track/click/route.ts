import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/database/db';

export async function POST(request: NextRequest) {
  try {
    const { postId } = await request.json();
    
    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    // Update click count
    await prisma.post.update({
      where: { id: postId },
      data: { clicks: { increment: 1 } }
    });

    return NextResponse.json({ message: 'Click recorded' });
  } catch (error) {
    console.error('Error tracking click:', error);
    return NextResponse.json(
      { error: 'Failed to track click' },
      { status: 500 }
    );
  }
}
