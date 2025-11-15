'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { BlogHero } from './blog-hero';
import { PostCard } from './post-card';
import { CTACard } from './cta-card';
import { Button } from '@/ui/components/button';
import { Loader2 } from 'lucide-react';

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
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
  };
  views: number;
  clicks: number;
  isFeatured: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function BlogPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [featuredPost, setFeaturedPost] = useState<Post | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('category') || ''
  );
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('search') || ''
  );

  // Fetch posts
  const fetchPosts = useCallback(async (page = 1, append = false) => {
    try {
      const params = new URLSearchParams();
      if (page > 1) params.append('page', page.toString());
      if (selectedCategory) params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await fetch(`/api/blog/posts?${params}`);
      const data = await response.json();
      
      if (append) {
        setPosts(prev => [...prev, ...data.posts]);
      } else {
        setPosts(data.posts);
      }
      
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  }, [selectedCategory, searchQuery]);

  // Fetch featured post
  const fetchFeaturedPost = useCallback(async () => {
    try {
      const response = await fetch('/api/blog/posts?featured=true&limit=1');
      const data = await response.json();
      if (data.posts.length > 0) {
        setFeaturedPost(data.posts[0]);
      }
    } catch (error) {
      console.error('Error fetching featured post:', error);
    }
  }, []);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/blog/categories');
      const data = await response.json();
      setCategories(data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  // Track view
  const trackView = useCallback(async (postId: string) => {
    try {
      await fetch('/api/blog/track/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId })
      });
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  }, []);

  // Track click
  const trackClick = useCallback(async (postId: string) => {
    try {
      await fetch('/api/blog/track/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId })
      });
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  }, []);

  // Handle category change
  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
    router.push(`/blog?${new URLSearchParams({
      ...(category && { category }),
      ...(searchQuery && { search: searchQuery })
    })}`);
  }, [router, searchQuery]);

  // Handle search change
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    router.push(`/blog?${new URLSearchParams({
      ...(selectedCategory && { category: selectedCategory }),
      ...(query && { search: query })
    })}`);
  }, [router, selectedCategory]);

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    setSelectedCategory('');
    setSearchQuery('');
    router.push('/blog');
  }, [router]);

  // Load more posts
  const loadMore = useCallback(async () => {
    if (!pagination?.hasNext || loadingMore) return;
    
    setLoadingMore(true);
    await fetchPosts(pagination.page + 1, true);
    setLoadingMore(false);
  }, [pagination, loadingMore, fetchPosts]);

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchFeaturedPost(),
        fetchPosts(),
        fetchCategories()
      ]);
      setLoading(false);
    };
    
    fetchData();
  }, [fetchFeaturedPost, fetchPosts, fetchCategories]);

  // Refetch posts when filters change
  useEffect(() => {
    if (!loading) {
      fetchPosts();
    }
  }, [selectedCategory, searchQuery, fetchPosts, loading]);

  if (loading) {
    return <BlogPageSkeleton />;
  }

  return (
    <div className="space-y-8">
      {/* Featured Post Hero */}
      {featuredPost && (
        <BlogHero post={featuredPost} />
      )}



      {/* Main Content Grid */}
      <div className="space-y-8">
        {/* First Row - 3 Blog Posts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts?.slice(0, 3).map((post) => (
            <PostCard 
              key={post.id}
              post={post} 
              onTrackClick={trackClick}
            />
          ))}
        </div>

        {/* Second Row - 2 Promotional Blocks + 2 Blog Posts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Single Promotional Block with 2 sections */}
          <div className="lg:col-span-1">
            <div className="bg-black text-white p-6 rounded-xl h-full flex flex-col">
              {/* First Section - 50% height */}
              <div className="flex-1 flex flex-col justify-center">
                <h3 className="text-3xl lg:text-4xl xl:text-5xl font-black mb-4 leading-tight">Get a ride when you need one</h3>
                <Link href="/auth/signup" className="text-lg lg:text-xl text-white underline hover:text-gray-200">
                  Sign up to Freelancer
                </Link>
              </div>
              
              {/* Separator Line */}
              <div className="flex justify-center py-4">
                <div className="w-2/3 h-px bg-white"></div>
              </div>
              
              {/* Second Section - 50% height */}
              <div className="flex-1 flex flex-col justify-center">
                <h3 className="text-3xl lg:text-4xl xl:text-5xl font-black mb-4 leading-tight">Start earning in your city</h3>
                <Link href="/auth/signup" className="text-lg lg:text-xl text-white underline hover:text-gray-200">
                  Sign up to Freelancer
                </Link>
              </div>
            </div>
          </div>
          
          {/* Right Side - 2 Blog Posts */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts?.slice(3, 5).map((post) => (
                <PostCard 
                  key={post.id}
                  post={post} 
                  onTrackClick={trackClick}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Third Row - 2 Small Blog Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts?.slice(5, 7).map((post) => (
            <PostCard 
              key={post.id}
              post={post} 
              onTrackClick={trackClick}
            />
          ))}
        </div>

        {/* Remaining Posts in 3-column Grid */}
        {posts && posts.length > 7 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts?.slice(7).map((post) => (
              <PostCard 
                key={post.id}
                post={post} 
                onTrackClick={trackClick}
              />
            ))}
          </div>
        )}

        {/* Load More Button */}
        {pagination?.hasNext && (
          <div className="mt-8 text-center">
            <Button
              onClick={loadMore}
              disabled={loadingMore}
              size="lg"
              variant="outline"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load More Stories'
              )}
            </Button>
          </div>
        )}

        {/* No Posts Message */}
        {posts && posts.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No posts found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

function BlogPageSkeleton() {
  return (
    <div className="space-y-8">
      {/* Hero Skeleton */}
      <div className="bg-gray-200 rounded-2xl h-96 animate-pulse" />
      
              {/* Grid Skeleton */}
        <div className="space-y-8">
          {/* First Row - 3 Blog Posts */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-xl h-80 animate-pulse" />
            ))}
          </div>
          
          {/* Second Row - 2 Promotional Blocks + 2 Blog Posts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-gray-200 rounded-xl h-80 animate-pulse" />
            </div>
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="bg-gray-200 rounded-xl h-80 animate-pulse" />
                ))}
              </div>
            </div>
          </div>

          {/* Third Row - 2 Small Blog Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-xl h-80 animate-pulse" />
            ))}
          </div>
        </div>
    </div>
  );
}
