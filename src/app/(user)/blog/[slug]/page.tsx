import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getServerSessionUser } from '@/features/auth/auth-server';
import { BlogPostClient } from '@/features/blog/components/blog-post-client';
import { UserLayout } from '@/features/shared/components/user-layout';

interface BlogPostPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/blog/posts/${params.slug}`);
    
    if (!response.ok) {
      return {
        title: 'Post Not Found - Developer Connect',
        description: 'The requested blog post could not be found.'
      };
    }

    const { post } = await response.json();
    
    return {
      title: `${post.title} - Developer Connect`,
      description: post.excerpt || post.title,
      openGraph: {
        title: post.title,
        description: post.excerpt || post.title,
        type: 'article',
        url: `/blog/${post.slug}`,
        images: post.coverUrl ? [{ url: post.coverUrl }] : [],
        authors: [post.author.name],
        publishedTime: post.publishedAt,
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: post.excerpt || post.title,
        images: post.coverUrl ? [post.coverUrl] : [],
      },
      alternates: {
        canonical: `/blog/${params.slug}`,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Blog Post - Developer Connect',
      description: 'Developer Connect blog post',
    };
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  try {
    const user = await getServerSessionUser();
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/blog/posts/${params.slug}`);
    
    if (!response.ok) {
      notFound();
    }

    return (
      <UserLayout user={user}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
          {/* Main Content */}
          <main className="flex-1">
            <Suspense fallback={<BlogPostSkeleton />}>
              <BlogPostClient key={params.slug} slug={params.slug} />
            </Suspense>
          </main>
        </div>
      </UserLayout>
    );
  } catch (error) {
    notFound();
  }
}

function BlogPostSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="bg-gray-200 rounded-lg h-8 w-32 mb-4 animate-pulse" />
          <div className="bg-gray-200 rounded-lg h-12 w-3/4 mb-4 animate-pulse" />
          <div className="bg-gray-200 rounded-lg h-6 w-1/2 animate-pulse" />
        </div>
        
        {/* Cover Image Skeleton */}
        <div className="bg-gray-200 rounded-xl h-96 mb-8 animate-pulse" />
        
        {/* Content Skeleton */}
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-4 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
