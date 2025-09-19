'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/ui/components/badge';
import { Button } from '@/ui/components/button';
import { Calendar, MapPin } from 'lucide-react';

interface BlogHeroProps {
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
  };
}

export function BlogHero({ post }: BlogHeroProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        {/* Left side - Featured Image */}
        <div className="relative h-80 lg:h-full min-h-[400px]">
          {post.coverUrl ? (
            <Image
              src={post.coverUrl}
              alt={post.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 text-lg">No Image</span>
            </div>
          )}
        </div>
        
        {/* Right side - Content */}
        <div className="p-8 lg:p-12 flex flex-col justify-center">
          {/* Category and Meta */}
          <div className="flex items-center gap-3 mb-4">
            {post.category && (
              <Badge 
                variant="secondary" 
                className="bg-blue-100 text-blue-800 hover:bg-blue-200"
              >
                {post.category.name}
              </Badge>
            )}
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Calendar className="w-4 h-4" />
              {formatDate(post.publishedAt)}
            </div>
            {post.region && (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <MapPin className="w-4 h-4" />
                {post.region}
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {post.title}
          </h1>
          
          {/* Excerpt */}
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            {post.excerpt}
          </p>

          {/* Author and CTA */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {post.author.avatar ? (
                <Image
                  src={post.author.avatar}
                  alt={post.author.name}
                  width={40}
                  height={40}
                  className="rounded-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-sm font-medium">
                    {post.author.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-gray-700 font-medium">{post.author.name}</span>
            </div>
            
            <Link href={`/blog/${post.slug}`}>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                Read Full Story
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
