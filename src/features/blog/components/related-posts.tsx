'use client';

import { ImageWithShimmer } from '@/ui/components/image-with-shimmer';
import Link from 'next/link';
import { Badge } from '@/ui/components/badge';
import { Calendar, MapPin } from 'lucide-react';

interface RelatedPost {
  id: string;
  slug: string;
  title: string;
  coverUrl: string;
  category?: {
    name: string;
  };
  publishedAt: string;
  author: {
    name: string;
  };
}

interface RelatedPostsProps {
  posts: RelatedPost[];
}

export function RelatedPosts({ posts }: RelatedPostsProps) {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (!posts || posts.length === 0) return null;

  return (
    <section className="border-t border-gray-200 pt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Related Stories
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Link 
            key={post.id} 
            href={`/blog/${post.slug}`}
            className="group block"
          >
            <article className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100">
              <div className="relative aspect-[16/10] overflow-hidden">
                {post.coverUrl && (
                  <ImageWithShimmer
                    src={post.coverUrl}
                    alt={post.title || 'Related post'}
                    fill
                    aspectRatio="16/10"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    shimmerSize="card"
                  />
                )}
                {post.category && (
                  <div className="absolute top-3 left-3">
                    <Badge 
                      variant="secondary" 
                      className="bg-white/90 text-gray-800 hover:bg-white text-xs"
                    >
                      {post.category.name}
                    </Badge>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors text-sm leading-tight">
                  {post.title || 'Untitled Post'}
                </h3>
                
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <Calendar className="w-3 h-3" />
                  {formatDate(post.publishedAt)}
                </div>
                
                <div className="text-xs text-gray-600 font-medium">
                  by {post.author?.name || 'Unknown Author'}
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
      
      <div className="mt-6 text-center">
        <Link 
          href="/blog"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          View all stories →
        </Link>
      </div>
    </section>
  );
}
