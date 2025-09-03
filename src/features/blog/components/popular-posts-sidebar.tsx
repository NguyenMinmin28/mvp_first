'use client';

import Image from 'next/image';
import Link from 'next/link';
import { TrendingUp, Eye } from 'lucide-react';

interface PopularPost {
  id: string;
  slug: string;
  title: string;
  coverUrl: string;
  views: number;
  category?: {
    name: string;
  };
}

interface PopularPostsSidebarProps {
  posts: PopularPost[];
  onTrackClick?: (postId: string) => void;
}

export function PopularPostsSidebar({ posts, onTrackClick }: PopularPostsSidebarProps) {
  const handleClick = (postId: string) => {
    if (onTrackClick) {
      onTrackClick(postId);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-orange-500" />
        <h3 className="text-lg font-semibold text-gray-900">Most Popular</h3>
      </div>
      
      <div className="space-y-4">
        {posts.map((post, index) => (
          <Link 
            key={post.id} 
            href={`/blog/${post.slug}`}
            onClick={() => handleClick(post.id)}
            className="group block"
          >
            <article className="flex gap-3">
              <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                {post.coverUrl ? (
                  <Image
                    src={post.coverUrl}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 text-xs">No Image</span>
                  </div>
                )}
                {index < 3 && (
                  <div className="absolute top-1 left-1 w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {index + 1}
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 text-sm leading-tight mb-1">
                  {post.title}
                </h4>
                
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {post.category && (
                    <span className="text-blue-600 font-medium">
                      {post.category.name}
                    </span>
                  )}
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {post.views.toLocaleString()}
                  </div>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-100">
        <Link 
          href="/blog?sort=popular" 
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View all popular posts →
        </Link>
      </div>
    </div>
  );
}
