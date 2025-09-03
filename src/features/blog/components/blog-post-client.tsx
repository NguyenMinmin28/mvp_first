'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/ui/components/badge';
import { Button } from '@/ui/components/button';
import { Calendar, MapPin, Clock, Eye, Share2, MessageCircle, ArrowLeft } from 'lucide-react';
import { PlainTextRenderer } from './plain-text-renderer';

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverUrl: string;
  category?: {
    id: string;
    name: string;
    slug: string;
    color?: string;
  };
  publishedAt: string;
  region?: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    bio?: string;
  };
  views: number;
  tags: string[];
}

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

interface BlogPostData {
  post: Post;
  relatedPosts: RelatedPost[];
}

interface BlogPostClientProps {
  slug: string;
}

export function BlogPostClient({ slug }: BlogPostClientProps) {
  const [data, setData] = useState<BlogPostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewTracked, setViewTracked] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Fetch post data
  const fetchPost = useCallback(async () => {
    try {
      const response = await fetch(`/api/blog/posts/${slug}`);
      if (!response.ok) {
        throw new Error('Failed to fetch post');
      }
      const postData = await response.json();
      setData(postData);
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  // Track view
  const trackView = useCallback(async (postId: string) => {
    if (viewTracked) return;
    
    try {
      await fetch('/api/blog/track/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId })
      });
      setViewTracked(true);
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  }, [viewTracked]);

  // Share post
  const sharePost = useCallback(async () => {
    if (navigator.share && data?.post) {
      try {
        await navigator.share({
          title: data.post.title,
          text: data.post.excerpt,
          url: window.location.href,
        });
      } catch (error) {
        // Fallback to copying link
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  }, [data]);

  // Copy link to clipboard
  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    // You could add a toast notification here
  }, []);

  // Calculate read time
  const calculateReadTime = useCallback((content: string) => {
    if (!content) return 1;
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  }, []);

  // Format date
  const formatDate = useCallback((dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchPost();
    }
    
    // Cleanup function to prevent memory leaks and DOM issues
    return () => {
      setData(null);
      setLoading(true);
    };
  }, [mounted, fetchPost]);

  useEffect(() => {
    if (mounted && data?.post && !viewTracked) {
      trackView(data.post.id);
    }
  }, [mounted, data, viewTracked, trackView]);

  if (!mounted) {
    return <BlogPostSkeleton />;
  }

  if (loading) {
    return <BlogPostSkeleton />;
  }

  if (!data || !data.post) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Post not found</h1>
        <Link href="/blog">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Button>
        </Link>
      </div>
    );
  }

  const { post, relatedPosts } = data;
  const readTime = calculateReadTime(post.content);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/blog">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            {post.category && (
              <Link href={`/blog?category=${post.category.slug}`}>
                <Badge variant="secondary" className="hover:bg-blue-100">
                  {post.category.name}
                </Badge>
              </Link>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              {formatDate(post.publishedAt)}
            </div>
            {post.region && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin className="w-4 h-4" />
                {post.region}
              </div>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            {post.title}
          </h1>
          
          {post.excerpt && (
            <p className="text-xl text-gray-600 mb-6 leading-relaxed">
              {post.excerpt}
            </p>
          )}

          {/* Author and Meta */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {post.author?.avatar && (
                <Image
                  src={post.author.avatar}
                  alt={post.author.name || 'Author'}
                  width={48}
                  height={48}
                  className="rounded-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              )}
              <div>
                <div className="font-medium text-gray-900">{post.author?.name || 'Unknown Author'}</div>
                {post.author?.bio && (
                  <div className="text-sm text-gray-600">{post.author.bio}</div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {readTime} min read
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {(post.views || 0).toLocaleString()} views
              </div>
            </div>
          </div>
        </header>

        {/* Cover Image */}
        {post.coverUrl && (
          <div className="mb-8">
            <Image
              src={post.coverUrl}
              alt={post.title}
              width={1200}
              height={600}
              className="w-full rounded-xl"
              priority
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Content */}
        <article className="mb-12">
          <PlainTextRenderer 
            content={post.content} 
            className="text-gray-800 leading-relaxed"
          />
        </article>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-sm">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Share and Actions */}
        <div className="flex items-center justify-between py-6 border-t border-gray-200 mb-8">
          <div className="flex items-center gap-4">
            <Button onClick={sharePost} variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <MessageCircle className="w-4 h-4 mr-2" />
              Comment
            </Button>
          </div>
          
          <div className="text-sm text-gray-500">
            Published on {formatDate(post.publishedAt)}
          </div>
        </div>

        {/* Related Posts - Temporarily disabled to avoid import issues */}
        {relatedPosts && relatedPosts.length > 0 && (
          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Related Stories
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.slice(0, 3).map((post) => (
                <Link 
                  key={post.id} 
                  href={`/blog/${post.slug}`}
                  className="group block"
                >
                  <article className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      {post.coverUrl && (
                        <Image
                          src={post.coverUrl}
                          alt={post.title || 'Related post'}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
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
          </div>
        )}
      </div>
    </div>
  );
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
