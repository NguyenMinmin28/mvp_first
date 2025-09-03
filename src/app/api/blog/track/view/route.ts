import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/database/db';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { postId } = await request.json();
    
    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    // Get client IP and cookie for rate limiting
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const cookieStore = cookies();
    const viewCookie = cookieStore.get(`view_${postId}`);

    // Check if view was already recorded in last 12 hours
    if (viewCookie) {
      const lastView = new Date(viewCookie.value);
      const hoursSinceLastView = (Date.now() - lastView.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastView < 12) {
        return NextResponse.json({ message: 'View already recorded' });
      }
    }

    // Update view count
    await prisma.post.update({
      where: { id: postId },
      data: { views: { increment: 1 } }
    });

    // Set cookie to prevent duplicate views
    const response = NextResponse.json({ message: 'View recorded' });
    response.cookies.set(`view_${postId}`, new Date().toISOString(), {
      maxAge: 12 * 60 * 60, // 12 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    });

    return response;
  } catch (error) {
    console.error('Error tracking view:', error);
    return NextResponse.json(
      { error: 'Failed to track view' },
      { status: 500 }
    );
  }
}
