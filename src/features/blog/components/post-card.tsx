'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/ui/components/badge';
import { Calendar, MapPin, Clock, Eye } from 'lucide-react';

interface PostCardProps {
  post: {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    coverUrl: string;
    category?: {
      name: string;
      color?: string;
    };
    publishedAt: string;
    region?: string;
    author: {
      name: string;
      avatar?: string;
    };
    views: number;
    readTime?: number;
  };
  onTrackClick?: (postId: string) => void;
}

export function PostCard({ post, onTrackClick }: PostCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatReadTime = (minutes: number) => {
    if (minutes < 1) return '1 min read';
    return `${Math.ceil(minutes)} min read`;
  };

  const handleClick = () => {
    if (onTrackClick) {
      onTrackClick(post.id);
    }
  };

  return (
    <article className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100">
      <Link href={`/blog/${post.slug}`} onClick={handleClick}>
        <div className="relative aspect-[16/10] overflow-hidden">
          {post.coverUrl ? (
            <Image
              src={post.coverUrl}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 text-sm">No Image</span>
            </div>
          )}
          {post.category && (
            <div className="absolute top-3 left-3">
              <Badge 
                variant="secondary" 
                className="bg-white/90 text-gray-800 hover:bg-white"
              >
                {post.category.name}
              </Badge>
            </div>
          )}
        </div>
        
        <div className="p-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <Calendar className="w-4 h-4" />
            {formatDate(post.publishedAt)}
            {post.region && (
              <>
                <span>•</span>
                <MapPin className="w-4 h-4" />
                {post.region}
              </>
            )}
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {post.title}
          </h3>
          
          <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
            {post.excerpt}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {post.author.avatar ? (
                <Image
                  src={post.author.avatar}
                  alt={post.author.name}
                  width={32}
                  height={32}
                  className="rounded-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-xs font-medium">
                    {post.author.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-sm font-medium text-gray-700">
                {post.author.name}
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {post.readTime && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatReadTime(post.readTime)}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {post.views.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
