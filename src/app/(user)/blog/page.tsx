import { Suspense } from 'react';
import { Metadata } from 'next';
import { getServerSessionUser } from '@/features/auth/auth-server';
import { BlogPageClient } from '@/features/blog/components/blog-page-client';
import { UserLayout } from '@/features/shared/components/user-layout';

export const metadata: Metadata = {
  title: 'Clevrs Blog – Freelancing Insights, Tips & Success Stories',
  description: 'Discover insights, tutorials, and success stories from the freelancing community. Stay updated with the latest trends in remote work and direct client connections.',
  openGraph: {
    title: 'Clevrs Blog – Freelancing Insights, Tips & Success Stories',
    description: 'Discover insights, tutorials, and success stories from the freelancing community.',
    type: 'website',
    url: '/blog',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clevrs Blog – Freelancing Insights, Tips & Success Stories',
    description: 'Discover insights, tutorials, and success stories from the freelancing community.',
  },
};

export default async function BlogPage() {
  const user = await getServerSessionUser();
  
  return (
    <UserLayout user={user}>
      <div className="min-h-[calc(100vh-200px)] bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Main Content */}
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Developer Blog
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl">
                Discover insights, tutorials, and stories from our community of developers, 
                entrepreneurs, and tech enthusiasts.
              </p>
            </div>
            
            <Suspense fallback={<BlogPageSkeleton />}>
              <BlogPageClient />
            </Suspense>
          </div>
        </main>
      </div>
    </UserLayout>
  );
}

function BlogPageSkeleton() {
  return (
    <div className="space-y-8">
      {/* Hero Skeleton */}
      <div className="bg-gray-200 rounded-2xl h-96 animate-pulse" />
      
      {/* Filters Skeleton */}
      <div className="bg-gray-200 rounded-xl h-32 animate-pulse" />
      
      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-xl h-80 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
