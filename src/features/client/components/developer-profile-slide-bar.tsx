"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/ui/components/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/components/avatar";
import { Badge } from "@/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/components/tabs";
import { X, Star, MapPin, Clock, DollarSign, MessageCircle, Heart, ExternalLink, User, Briefcase, GraduationCap, Code, Award, Calendar, Globe, Lock, ChevronLeft, ChevronRight } from "lucide-react";
import { GetInTouchButton } from "@/features/shared/components/get-in-touch-button";
import { AuthRequiredModal } from "@/features/shared/components/auth-required-modal";
import { FollowButton } from "@/ui/components/modern-button";

interface DeveloperProfileSlideBarProps {
  isOpen: boolean;
  onClose: () => void;
  developerId: string;
  developerName?: string;
  useOriginalDesign?: boolean;
}

interface DeveloperProfile {
  id: string;
  userId?: string; // User ID for follow functionality
  name: string;
  image?: string;
  photoUrl?: string;
  location?: string;
  bio?: string;
  hourlyRateUsd?: number;
  level: string;
  experienceYears?: number;
  currentStatus: string;
  usualResponseTimeMs?: number;
  jobsCount: number;
  reviews: {
    averageRating: number;
    totalReviews: number;
  };
  skills: string[];
  portfolioLinks?: Array<{
    id: string;
    title: string;
    description?: string;
    url: string;
    imageUrl?: string;
  }>;
  workHistory?: Array<{
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    description?: string;
  }>;
  education?: Array<{
    id: string;
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate?: string;
  }>;
  certifications?: Array<{
    id: string;
    name: string;
    issuer: string;
    date: string;
  }>;
  languages?: Array<{
    id: string;
    language: string;
    proficiency: string;
  }>;
}

export function DeveloperProfileSlideBar({ 
  isOpen, 
  onClose, 
  developerId, 
  developerName,
  useOriginalDesign = false
}: DeveloperProfileSlideBarProps) {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<DeveloperProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentPortfolioIndex, setCurrentPortfolioIndex] = useState(0);
  const [reviews, setReviews] = useState<Array<{
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    fromUser: {
      id: string;
      name: string;
      image?: string;
    };
    project: {
      id: string;
      title: string;
    };
  }>>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsStats, setReviewsStats] = useState<{
    averageRating: number;
    totalReviews: number;
  } | null>(null);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [earnedAmount, setEarnedAmount] = useState<number>(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [portfolioLikes, setPortfolioLikes] = useState<Record<string, { liked: boolean; likeCount: number }>>({});
  const [portfolioLikeLoading, setPortfolioLikeLoading] = useState<Record<string, boolean>>({});
  const fetchedPortfolioIds = useRef<Set<string>>(new Set());
  const [services, setServices] = useState<Array<{
    id: string;
    slug: string;
    title: string;
    shortDesc: string;
    coverUrl?: string | null;
    priceType: string;
    priceMin?: number | null;
    priceMax?: number | null;
    skills: string[];
    categories: string[];
    galleryImages?: string[];
    showcaseImages?: string[];
  }>>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [totalServicesCount, setTotalServicesCount] = useState(0);
  const [serviceImageIndices, setServiceImageIndices] = useState<Record<string, number>>({});
  const [isScrolling, setIsScrolling] = useState(false);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const isAuthenticated = !!session?.user;
  const isDeveloper = session?.user?.role === "DEVELOPER";
  const isOwnProfile = session?.user?.id === profile?.userId;

  const fetchDeveloperProfile = useCallback(async () => {
    try {
      setLoading(true);
      
      const res = await fetch(`/api/developer/${developerId}`, { cache: "no-store" });
      
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching developer profile:", error);
    } finally {
      setLoading(false);
    }
  }, [developerId]);

  const fetchReviews = useCallback(async () => {
    if (!developerId) return;
    
    try {
      setReviewsLoading(true);
      const response = await fetch(`/api/developer/${developerId}/reviews`, {
        cache: "no-store"
      });
      
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
        // Update reviews stats from API response
        if (data.averageRating !== undefined && data.totalReviews !== undefined) {
          setReviewsStats({
            averageRating: data.averageRating,
            totalReviews: data.totalReviews
          });
        } else if (data.reviews && data.reviews.length > 0) {
          // Calculate from reviews if API doesn't provide stats
          const avg = data.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / data.reviews.length;
          setReviewsStats({
            averageRating: Math.round(avg * 10) / 10,
            totalReviews: data.reviews.length
          });
        } else {
          setReviewsStats({
            averageRating: 0,
            totalReviews: 0
          });
        }
      } else {
        setReviews([]);
        setReviewsStats(null);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, [developerId]);

  const fetchFollowStatus = useCallback(async () => {
    if (!developerId || !profile?.userId) return;
    
    // Fetch followers count (public, no auth required)
    try {
      const response = await fetch(`/api/user/follow?developerId=${profile.userId}`, {
        cache: "no-store"
      });
      
      if (response.ok) {
        const data = await response.json();
        setFollowersCount(data.followersCount || 0);
        
        // Only fetch follow status if authenticated and not own profile
        if (isAuthenticated && session?.user?.id !== profile.userId) {
          setIsFollowing(data.isFollowing || false);
        } else if (session?.user?.id === profile.userId) {
          setIsFollowing(false);
        }
      }
    } catch (error) {
      console.error("Error fetching follow status:", error);
    }
  }, [developerId, profile?.userId, isAuthenticated, session?.user?.id]);

  const handleFollowToggle = async () => {
    if (!isAuthenticated || !profile?.userId) {
      setShowAuthModal(true);
      return;
    }

    if (isFollowLoading) return;

    const action = isFollowing ? "unfollow" : "follow";
    const previousState = isFollowing;

    // Optimistic update
    setIsFollowing(!isFollowing);
    setIsFollowLoading(true);

    try {
      const response = await fetch('/api/user/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          developerId: profile.userId,
          action: action
        })
      });

      if (!response.ok) {
        // Revert on error
        setIsFollowing(previousState);
        throw new Error('Failed to toggle follow');
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      setIsFollowing(previousState);
    } finally {
      setIsFollowLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && developerId) {
      fetchDeveloperProfile();
      setCurrentPortfolioIndex(0); // Reset portfolio index when opening
      setReviewsStats(null); // Reset reviews stats when opening
      // Fetch reviews for all users (authenticated and unauthenticated)
      fetchReviews();
    } else if (!isOpen) {
      // Reset when closing
      setReviews([]);
      setReviewsStats(null);
      setShowStickyHeader(false); // Reset sticky header when closing
    }
  }, [isOpen, developerId, fetchDeveloperProfile, fetchReviews]);

  // Fetch follow status and followers count when profile is loaded
  useEffect(() => {
    if (profile?.userId) {
      fetchFollowStatus();
    }
  }, [profile?.userId, fetchFollowStatus]);

  // Calculate earned amount (estimate from jobs count and hourly rate)
  useEffect(() => {
    if (profile) {
      // Simple estimate: jobsCount * hourlyRate * 40 (average hours per project)
      const estimatedEarned = (profile.jobsCount || 0) * (profile.hourlyRateUsd || 0) * 40;
      setEarnedAmount(estimatedEarned);
    }
  }, [profile]);

  // Fetch services for developer
  const fetchServices = useCallback(async () => {
    if (!developerId) return;
    
    try {
      setServicesLoading(true);
      // Fetch with limit 4 for display, and also get total count
      const response = await fetch(`/api/developers/${developerId}/services?limit=10`, {
        cache: "no-store"
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          const servicesData = data.data.slice(0, 4);
          setServices(servicesData);
          setTotalServicesCount(data.data.length);
          
          // Debug: log image counts for each service
          servicesData.forEach((service: any) => {
            const allImgs: string[] = [];
            if (service.coverUrl) allImgs.push(service.coverUrl);
            if (service.galleryImages) allImgs.push(...service.galleryImages.filter(Boolean));
            if (service.showcaseImages) allImgs.push(...service.showcaseImages.filter(Boolean));
            const uniqueImgs = Array.from(new Set(allImgs.filter(Boolean)));
            console.log(`📸 Service "${service.title}": ${uniqueImgs.length} images`, {
              coverUrl: service.coverUrl,
              galleryCount: service.galleryImages?.length || 0,
              showcaseCount: service.showcaseImages?.length || 0,
              uniqueCount: uniqueImgs.length
            });
          });
        }
      }
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setServicesLoading(false);
    }
  }, [developerId]);

  useEffect(() => {
    if (isOpen && developerId) {
      fetchServices();
    }
  }, [isOpen, developerId, fetchServices]);

  // Auto-rotate service images with smooth slide-up animation
  useEffect(() => {
    if (services.length === 0) return;

    const intervals: Record<string, NodeJS.Timeout> = {};

    services.forEach((service) => {
      const getAllImages = () => {
        const images: string[] = [];
        if (service.coverUrl) images.push(service.coverUrl);
        if (service.galleryImages) images.push(...service.galleryImages.filter(Boolean));
        if (service.showcaseImages) images.push(...service.showcaseImages.filter(Boolean));
        return images.filter(Boolean);
      };

      const allImages = getAllImages();
      if (allImages.length <= 1) {
        // Initialize with 0 even if only one image
        if (serviceImageIndices[service.id] === undefined) {
          setServiceImageIndices(prev => ({ ...prev, [service.id]: 0 }));
        }
        return; // Skip auto-rotate if only one image
      }

      // Initialize index if not set
      if (serviceImageIndices[service.id] === undefined) {
        setServiceImageIndices(prev => ({ ...prev, [service.id]: 0 }));
      }

      // Auto-rotate every 3 seconds with smooth transition
      intervals[service.id] = setInterval(() => {
        setServiceImageIndices(prev => {
          const currentIndex = prev[service.id] || 0;
          const nextIndex = (currentIndex + 1) % allImages.length;
          console.log(`🔄 Rotating service ${service.id} image: ${currentIndex} -> ${nextIndex}`);
          return { ...prev, [service.id]: nextIndex };
        });
      }, 3000);
    });

    return () => {
      Object.values(intervals).forEach(interval => clearInterval(interval));
    };
  }, [services]);


  // Reset portfolio index when profile changes
  useEffect(() => {
    if (profile?.portfolioLinks) {
      setCurrentPortfolioIndex(0);
    }
  }, [profile?.portfolioLinks]);

  // Memoize portfolio IDs to avoid unnecessary re-renders
  const portfolioIds = useMemo(() => {
    if (!profile?.portfolioLinks) return [];
    return profile.portfolioLinks.map(p => p.id).filter(Boolean) as string[];
  }, [profile?.portfolioLinks?.length, profile?.portfolioLinks?.map(p => p.id).join(',')]);

  // Fetch like status for current portfolio
  const fetchPortfolioLikeStatus = useCallback(async (portfolioId: string, force = false) => {
    if (!portfolioId) return;
    
    // Skip if already fetched (unless forced)
    if (!force && fetchedPortfolioIds.current.has(portfolioId)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/portfolio/${portfolioId}/like`, {
        cache: "no-store"
      });
      
      if (response.ok) {
        const data = await response.json();
        setPortfolioLikes(prev => ({
          ...prev,
          [portfolioId]: {
            liked: data.liked || false,
            likeCount: data.likeCount || 0
          }
        }));
        fetchedPortfolioIds.current.add(portfolioId);
      } else {
        // If not authenticated, set default values
        setPortfolioLikes(prev => ({
          ...prev,
          [portfolioId]: {
            liked: false,
            likeCount: 0
          }
        }));
        fetchedPortfolioIds.current.add(portfolioId);
      }
    } catch (error) {
      console.error("Error fetching portfolio like status:", error);
      // Set default values on error
      setPortfolioLikes(prev => ({
        ...prev,
        [portfolioId]: {
          liked: false,
          likeCount: 0
        }
      }));
      fetchedPortfolioIds.current.add(portfolioId);
    }
  }, []);

  // Fetch like status when portfolio index changes
  useEffect(() => {
    const currentPortfolio = profile?.portfolioLinks?.[currentPortfolioIndex];
    if (currentPortfolio?.id) {
      fetchPortfolioLikeStatus(currentPortfolio.id);
    }
  }, [currentPortfolioIndex, profile?.portfolioLinks?.[currentPortfolioIndex]?.id, fetchPortfolioLikeStatus]);

  // Fetch like status for all portfolios when profile loads (only once)
  useEffect(() => {
    if (portfolioIds.length > 0) {
      portfolioIds.forEach((portfolioId) => {
        if (portfolioId && !fetchedPortfolioIds.current.has(portfolioId)) {
          fetchPortfolioLikeStatus(portfolioId);
        }
      });
    }
    
    // Reset fetched IDs when profile/developer changes
    return () => {
      if (developerId) {
        fetchedPortfolioIds.current.clear();
      }
    };
  }, [developerId, portfolioIds.length, fetchPortfolioLikeStatus]);

  // Handle portfolio like toggle
  const handlePortfolioLike = async (portfolioId: string) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (portfolioLikeLoading[portfolioId]) return;

    const currentLike = portfolioLikes[portfolioId];
    const previousLiked = currentLike?.liked || false;
    const previousCount = currentLike?.likeCount || 0;

    // Optimistic update
    setPortfolioLikes(prev => ({
      ...prev,
      [portfolioId]: {
        liked: !previousLiked,
        likeCount: previousLiked ? Math.max(0, previousCount - 1) : previousCount + 1
      }
    }));
    setPortfolioLikeLoading(prev => ({ ...prev, [portfolioId]: true }));

    try {
      const response = await fetch(`/api/portfolio/${portfolioId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        // Revert on error
        setPortfolioLikes(prev => ({
          ...prev,
          [portfolioId]: {
            liked: previousLiked,
            likeCount: previousCount
          }
        }));
        throw new Error('Failed to toggle like');
      }

      const data = await response.json();
      // Update with server response (already updated optimistically, but ensure sync)
      setPortfolioLikes(prev => ({
        ...prev,
        [portfolioId]: {
          liked: data.liked || false,
          likeCount: data.likeCount || 0
        }
      }));
      
      // Mark as fetched to prevent unnecessary refetch
      fetchedPortfolioIds.current.add(portfolioId);
    } catch (error) {
      console.error("Error toggling portfolio like:", error);
      // Revert on error
      setPortfolioLikes(prev => ({
        ...prev,
        [portfolioId]: {
          liked: previousLiked,
          likeCount: previousCount
        }
      }));
    } finally {
      setPortfolioLikeLoading(prev => ({ ...prev, [portfolioId]: false }));
    }
  };

  // Handle scroll detection for scrollbar visibility and sticky header
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || !isOpen) return;

    const handleScroll = () => {
      setIsScrolling(true);
      
      // Show sticky header when scrolled past 100px
      const scrollTop = scrollContainer.scrollTop;
      setShowStickyHeader(scrollTop > 100);
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Hide scrollbar after scrolling stops (300ms)
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 300);
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [isOpen]);

  // Handle ESC key and body scroll lock
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
    document.addEventListener("keydown", handleEsc);
      const scrollY = window.scrollY;
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
    }
    
    return () => {
      document.removeEventListener("keydown", handleEsc);
      if (isOpen) {
        const scrollY = document.body.style.top;
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        if (scrollY) window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    };
  }, [isOpen, onClose]);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .faded-scrollbar::-webkit-scrollbar {
          width: 8px !important;
        }
        .faded-scrollbar::-webkit-scrollbar-track {
          background: transparent !important;
        }
        .faded-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(229, 231, 235, 0.4) !important;
          border-radius: 10px !important;
          transition: background 0.3s ease-out !important;
        }
        .faded-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(209, 213, 219, 0.5) !important;
        }
        .faded-scrollbar.scrolling::-webkit-scrollbar-thumb {
          background: rgba(229, 231, 235, 0.45) !important;
        }
        .faded-scrollbar {
          scrollbar-width: thin !important;
          scrollbar-color: rgba(229, 231, 235, 0.4) transparent !important;
        }
        .faded-scrollbar:hover,
        .faded-scrollbar.scrolling {
          scrollbar-color: rgba(209, 213, 219, 0.5) transparent !important;
        }
      `}} />
      <div
        className={`fixed inset-0 z-[110] pointer-events-${isOpen ? "auto" : "none"}`}
        aria-hidden={!isOpen}
      >
      {/* Mobile backdrop: darken entire screen */}
      <div
        className={`fixed inset-0 bg-black/40 transition-opacity duration-300 lg:hidden ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Desktop backdrop: dim left 1/3, keep middle area clickable/transparent */}
      <div
        className={`fixed inset-y-0 left-0 w-1/3 bg-black/40 transition-opacity duration-300 hidden lg:block ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed inset-y-0 left-1/3 right-2/3 bg-transparent hidden lg:block ${isOpen ? "block" : "hidden"}`}
        onClick={onClose}
      />

      {/* Sliding panel - Full height from top to bottom */}
      <div
        className={`fixed right-0 top-0 h-full w-full sm:w-5/6 lg:w-2/3 bg-white shadow-2xl border-l border-gray-200 transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="h-full flex flex-col">
          {/* Mobile Close Button */}
          <button
            aria-label="Close"
            onClick={onClose}
            className="sm:hidden absolute top-3 right-3 z-30 p-2 rounded-full bg-white/90 border border-gray-200 shadow-md"
          >
            <X className="w-5 h-5 text-gray-900" />
          </button>

          {/* Header with Close Button */}
          <div className="flex items-center justify-between px-4 sm:px-6 pt-6 lg:pt-8 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3 min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Developer Profile</h2>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose} 
              className="hidden sm:flex hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Sticky Header - Shows when scrolling */}
          {showStickyHeader && profile && (
            <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Avatar */}
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarImage 
                    src={profile.photoUrl || profile.image || '/images/avata/default.jpeg'} 
                    className="object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/avata/default.jpeg';
                    }}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-gray-200 to-gray-300 w-full h-full flex items-center justify-center text-sm font-bold text-gray-600">
                    {(profile.name || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                {/* Name */}
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {profile.name || 'Unknown Developer'}
                  </h3>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {isAuthenticated ? (
                  <>
                    {/* Show Follow button for all authenticated users (not own profile) */}
                    {!isOwnProfile && (
                      <FollowButton
                        isFollowing={isFollowing}
                        onClick={handleFollowToggle}
                        disabled={isFollowLoading}
                        className="h-8 px-3 text-xs !border-gray-300 !text-gray-900 hover:!bg-gray-50 hover:!border-gray-400"
                        size="sm"
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </FollowButton>
                    )}
                    
                    {/* Show Get in Touch button for all authenticated users (not own profile) */}
                    {!isOwnProfile && (
                      <GetInTouchButton
                        developerId={profile.id}
                        developerName={profile.name || 'Unknown Developer'}
                        className="h-8 px-3 text-xs"
                        variant="default"
                      />
                    )}
                  </>
                ) : (
                  <Button 
                    variant="default" 
                    size="sm"
                    className="h-8 px-3 text-xs"
                    onClick={() => setShowAuthModal(true)}
                  >
                    Sign in
                  </Button>
                )}

                {/* Navigation Arrows for Portfolio */}
                {profile.portfolioLinks && profile.portfolioLinks.length > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const length = profile.portfolioLinks?.length || 0;
                        setCurrentPortfolioIndex((prev) => 
                          prev === 0 ? length - 1 : prev - 1
                        );
                      }}
                      className="w-8 h-8 rounded-full bg-white border border-gray-300 hover:bg-gray-50 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
                      aria-label="Previous portfolio"
                    >
                      <ChevronLeft className="h-4 w-4 text-gray-700" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const length = profile.portfolioLinks?.length || 0;
                        setCurrentPortfolioIndex((prev) => 
                          prev === length - 1 ? 0 : prev + 1
                        );
                      }}
                      className="w-8 h-8 rounded-full bg-white border border-gray-300 hover:bg-gray-50 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
                      aria-label="Next portfolio"
                    >
                      <ChevronRight className="h-4 w-4 text-gray-700" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Content - Scrollable */}
          <div 
            ref={scrollContainerRef}
            className={`flex-1 overflow-y-auto faded-scrollbar ${isScrolling ? 'scrolling' : ''}`}
          >
            {loading ? (
              <div className="p-4 space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-200 animate-pulse" />
                    <div className="h-3 w-24 bg-gray-200 animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-gray-200 animate-pulse" />
                  <div className="h-4 w-3/4 bg-gray-200 animate-pulse" />
                </div>
              </div>
            ) : profile ? (
              <div className="flex flex-col">
                {/* Profile Header Section - Fixed at top with 2 columns */}
                <div className="px-6 py-8 bg-gradient-to-br from-gray-50 via-white to-gray-50 border-b border-gray-100 flex-shrink-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                    {/* Left Column - Profile Info */}
                    <div className="flex flex-col items-center gap-0">
                      {/* Avatar Section */}
                      <div className="relative flex-shrink-0 group mb-1">
                        <Avatar className="w-28 h-28 sm:w-32 sm:h-32 ring-4 ring-white shadow-lg transition-all duration-200 hover:ring-gray-200 hover:shadow-xl hover:scale-105">
                      <AvatarImage 
                        src={profile.photoUrl || profile.image || '/images/avata/default.jpeg'} 
                            className="object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/avata/default.jpeg';
                        }}
                      />
                          <AvatarFallback className="bg-gradient-to-br from-gray-200 to-gray-300 w-full h-full flex items-center justify-center text-2xl font-bold text-gray-600">
                            {(profile.name || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span
                          className={`absolute right-0 bottom-0 sm:right-2 sm:bottom-2 inline-block w-6 h-6 sm:w-7 sm:h-7 rounded-full border-4 border-white shadow-md ${
                        (profile as any)?.accountStatus === 'online'
                          ? 'bg-green-500' 
                          : 'bg-gray-400'
                      }`}
                    />
                  </div>
                  
                      {/* Profile Info */}
                      <div className="text-center min-w-0 w-full mb-1">
                        <div className="flex items-center justify-center gap-2 mb-0">
                          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
                    {profile.name || 'Unknown Developer'}
                  </h3>
                  <Badge 
                            className={`ml-2 text-xs px-2.5 py-0.5 text-white font-semibold ${
                      useOriginalDesign 
                                ? 'bg-gray-600' 
                        : profile.level === 'EXPERT' 
                                  ? 'bg-gradient-to-r from-gray-800 to-black' 
                          : profile.level === 'MID' 
                                    ? 'bg-gradient-to-r from-gray-600 to-gray-700'
                                    : 'bg-gradient-to-r from-gray-500 to-gray-600'
                    }`}
                  >
                    {useOriginalDesign ? 'PRO' : (profile.level === 'EXPERT' ? 'EXPERT' : profile.level === 'MID' ? 'PRO' : 'STARTER')}
                  </Badge>
                        </div>

                        {profile.location && (
                          <div className="flex items-center justify-center gap-1.5 text-sm text-gray-600 mb-0">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{profile.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Stats Cards - Below Avatar */}
                      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-5 w-full -mt-0.5">
                        <div className="flex items-center justify-between gap-3 sm:gap-4 overflow-x-auto">
                          {/* Earned */}
                          <div className="flex flex-col flex-shrink-0 min-w-0">
                            <div className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight mb-0.5 whitespace-nowrap">
                              {earnedAmount >= 100000 
                                ? `$${Math.round(earnedAmount / 1000)}k+` 
                                : earnedAmount >= 1000 
                                  ? `$${(earnedAmount / 1000).toFixed(1)}k+`
                                  : `$${earnedAmount || 0}`}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500" style={{ color: '#999999' }}>Earned</div>
                          </div>

                          {/* Hired */}
                          <div className="flex flex-col flex-shrink-0 min-w-0">
                            <div className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight mb-0.5 whitespace-nowrap">
                              {profile.jobsCount || 0}x
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500" style={{ color: '#999999' }}>Hired</div>
                          </div>

                          {/* Rating */}
                          <div className="flex flex-col flex-shrink-0 min-w-0">
                            <div className="flex items-center gap-1 mb-0.5">
                              <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-black text-black flex-shrink-0" />
                              <span className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight whitespace-nowrap">
                                {reviewsStats 
                                  ? reviewsStats.averageRating.toFixed(2) 
                                  : (profile.reviews?.averageRating?.toFixed(2) || '0.00')}
                              </span>
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500" style={{ color: '#999999' }}>Rating</div>
                          </div>

                          {/* Followers */}
                          <div className="flex flex-col flex-shrink-0 min-w-0">
                            <div className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight mb-0.5 whitespace-nowrap">
                              {followersCount || 0}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500" style={{ color: '#999999' }}>Followers</div>
                          </div>
                        </div>
                      </div>

                  {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-2">
                    {isAuthenticated ? (
                      <>
                              {/* For developers viewing other developers: show Follow button only (not for own profile) */}
                              {isDeveloper && !isOwnProfile && (
                                <FollowButton
                                  isFollowing={isFollowing}
                                  onClick={handleFollowToggle}
                                  disabled={isFollowLoading}
                                  className="flex-1 sm:flex-initial sm:min-w-[140px]"
                                  size="md"
                                >
                                  {isFollowing ? 'Following' : 'Follow'}
                                </FollowButton>
                              )}
                              
                              {/* For clients: show Get in Touch button (not for own profile) */}
                              {!isDeveloper && !isOwnProfile && (
                        <GetInTouchButton
                          developerId={profile.id}
                          developerName={profile.name || 'Unknown Developer'}
                                  className="flex-1 sm:flex-initial sm:min-w-[140px]"
                          variant="default"
                        />
                              )}
                        
                        <Button 
                          variant="outline" 
                                size="default"
                          onClick={() => window.open(`/developer/${profile.id}`, '_blank')}
                                className="flex-1 sm:flex-initial hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 hover:scale-[1.02]"
                        >
                          <ExternalLink className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:translate-x-0.5" />
                          Full Profile
                        </Button>
                      </>
                    ) : (
                      <Button 
                        variant="default" 
                              size="default"
                              className="flex-1 sm:flex-initial sm:min-w-[180px] hover:bg-gray-800 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                        onClick={() => setShowAuthModal(true)}
                      >
                        <Lock className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:rotate-12" />
                        Sign in to Contact
                      </Button>
                    )}
                  </div>
                    </div>

                    {/* Right Column - Portfolio Carousel */}
                    <div className="lg:border-l lg:border-gray-200 lg:pl-8">
                      <div className="mb-4">
                        <h4 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">Portfolio</h4>
                        <p className="text-sm text-gray-500">
                          {profile.portfolioLinks?.length || 0} {profile.portfolioLinks?.length === 1 ? 'project' : 'projects'}
                        </p>
                          </div>

                      {profile.portfolioLinks && profile.portfolioLinks.length > 0 ? (
                        <div className="relative">
                          {/* Portfolio Carousel */}
                          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-gray-200 bg-gray-100 group">
                            {profile.portfolioLinks[currentPortfolioIndex] && (
                              <>
                                {profile.portfolioLinks[currentPortfolioIndex].imageUrl ? (
                                  <>
                                    <img 
                                      src={profile.portfolioLinks[currentPortfolioIndex].imageUrl} 
                                      alt={profile.portfolioLinks[currentPortfolioIndex].title || 'Portfolio'}
                                      className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                    {/* Like Button */}
                                    {profile.portfolioLinks?.[currentPortfolioIndex]?.id && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const portfolioId = profile.portfolioLinks?.[currentPortfolioIndex]?.id;
                                          if (portfolioId) {
                                            handlePortfolioLike(portfolioId);
                                          }
                                        }}
                                        disabled={portfolioLikeLoading[profile.portfolioLinks?.[currentPortfolioIndex]?.id || '']}
                                        aria-label="Like"
                                        className="absolute top-4 right-4 w-16 h-16 rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.18)] ring-1 ring-black/10 flex items-center justify-center transition-all duration-200 active:scale-95 hover:shadow-[0_12px_32px_rgba(0,0,0,0.25)] hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed z-20 group"
                                      >
                                        <Heart 
                                          className={`w-5 h-5 transition-all duration-200 group-hover:scale-110 ${
                                            portfolioLikes[profile.portfolioLinks?.[currentPortfolioIndex]?.id || '']?.liked
                                              ? 'fill-red-500 text-red-500'
                                              : 'text-black group-hover:text-red-400'
                                          }`}
                                        />
                                      </button>
                                    )}
                                    {/* Overlay with Info */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-4 sm:p-6">
                                      <h5 className="text-white text-lg sm:text-xl font-semibold mb-2">
                                        {profile.portfolioLinks[currentPortfolioIndex].title || 'Untitled'}
                                      </h5>
                                      {profile.portfolioLinks[currentPortfolioIndex].description && (
                                        <p className="text-white/90 text-sm sm:text-base line-clamp-2 mb-3">
                                          {profile.portfolioLinks[currentPortfolioIndex].description}
                                        </p>
                                      )}
                                      {profile.portfolioLinks?.[currentPortfolioIndex]?.url && (
                                    <Button 
                                      variant="default" 
                                      size="sm" 
                                          className="w-fit bg-white/90 hover:bg-white text-gray-900"
                                          onClick={() => {
                                            const url = profile.portfolioLinks?.[currentPortfolioIndex]?.url;
                                            if (url) {
                                              window.open(url, '_blank', 'noopener,noreferrer');
                                            }
                                          }}
                                        >
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        View Project
                                    </Button>
                                      )}
                            </div>
                                  </>
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-gray-100 to-gray-200">
                                    <Briefcase className="h-16 w-16 text-gray-400 mb-4" />
                                    <h5 className="text-lg font-semibold text-gray-700 mb-2">
                                      {profile.portfolioLinks[currentPortfolioIndex].title || 'Portfolio Item'}
                                    </h5>
                                    {profile.portfolioLinks[currentPortfolioIndex].description && (
                                      <p className="text-sm text-gray-600 text-center max-w-md">
                                        {profile.portfolioLinks[currentPortfolioIndex].description}
                                      </p>
                                    )}
                              </div>
                                )}
                              </>
                            )}

                            {/* Navigation Buttons */}
                            {profile.portfolioLinks && profile.portfolioLinks.length > 1 && (
                              <>
                                {/* Previous Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const length = profile.portfolioLinks?.length || 0;
                                    setCurrentPortfolioIndex((prev) => 
                                      prev === 0 ? length - 1 : prev - 1
                                    );
                                  }}
                                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl active:scale-95 z-10 group"
                                  aria-label="Previous portfolio"
                                >
                                  <ChevronLeft className="h-5 w-5 text-gray-700 transition-transform duration-200 group-hover:-translate-x-0.5" />
                                </button>

                                {/* Next Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const length = profile.portfolioLinks?.length || 0;
                                    setCurrentPortfolioIndex((prev) => 
                                      prev === length - 1 ? 0 : prev + 1
                                    );
                                  }}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl active:scale-95 z-10 group"
                                  aria-label="Next portfolio"
                                >
                                  <ChevronRight className="h-5 w-5 text-gray-700 transition-transform duration-200 group-hover:translate-x-0.5" />
                                </button>
                              </>
                            )}

                            {/* Dots Indicator */}
                            {profile.portfolioLinks && profile.portfolioLinks.length > 1 && (
                              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                                {profile.portfolioLinks.map((_, index) => (
                                  <button
                                    key={index}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCurrentPortfolioIndex(index);
                                    }}
                                    className={`h-2 rounded-full transition-all duration-200 ${
                                      index === currentPortfolioIndex
                                        ? 'w-8 bg-white shadow-md'
                                        : 'w-2 bg-white/50 hover:bg-white/75 hover:scale-125'
                                    }`}
                                    aria-label={`Go to portfolio ${index + 1}`}
                                  />
                            ))}
                            </div>
                            )}

                            {/* Portfolio Counter */}
                            {profile.portfolioLinks && profile.portfolioLinks.length > 1 && (
                              <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full z-10">
                                {currentPortfolioIndex + 1} / {profile.portfolioLinks.length}
                              </div>
                            )}
                            </div>
                          </div>
                                  ) : (
                        <div className="flex flex-col items-center justify-center py-12 px-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 aspect-[4/3]">
                          <Briefcase className="h-12 w-12 text-gray-400 mb-3" />
                          <p className="text-sm text-gray-500 text-center">No portfolio items yet</p>
                                    </div>
                                  )}
                    </div>
                  </div>
                </div>

                {/* Reviews Section */}
                <div className="border-t border-gray-200 p-4 sm:p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Reviews</h3>
                    {reviews.length > 0 && (
                      <span className="text-sm text-gray-500">
                        {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                      </span>
                    )}
                                </div>

                  {/* Reviews Grid */}
                  {reviewsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-gray-500">Loading reviews...</div>
                            </div>
                  ) : reviews.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {reviews.map((review) => {
                        const formatDate = (dateString: string) => {
                          return new Date(dateString).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          });
                        };

                        const renderStars = (rating: number) => {
                          const stars = [];
                          for (let i = 0; i < 5; i++) {
                            stars.push(
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < Math.round(rating)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            );
                          }
                          return stars;
                        };

                        const getInitials = (name: string) => {
                          if (!name) return 'U';
                          const parts = name.trim().split(' ');
                          if (parts.length >= 2) {
                            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                          }
                          return name.substring(0, 2).toUpperCase();
                        };

                        return (
                          <Card key={review.id} className="border-gray-200 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-200 hover:scale-[1.02] cursor-default">
                            <CardContent className="p-5">
                              {/* Review Text */}
                              {review.comment && (
                                <p className="text-sm sm:text-base text-gray-700 mb-4 leading-relaxed line-clamp-4">
                                  {review.comment}
                                    </p>
                                  )}
                                  
                              {/* Reviewer Info */}
                              <div className="flex items-start gap-3 pt-4 border-t border-gray-100">
                                <Avatar className="w-10 h-10 flex-shrink-0 ring-2 ring-gray-100 hover:ring-gray-300 transition-all duration-200 hover:scale-110 cursor-pointer">
                                  <AvatarImage 
                                    src={review.fromUser.image || '/images/avata/default.jpeg'}
                                    alt={review.fromUser.name || 'Client'}
                                    className="object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/images/avata/default.jpeg';
                                    }}
                                  />
                                  <AvatarFallback className="bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600 text-xs font-semibold">
                                    {getInitials(review.fromUser.name || 'U')}
                                  </AvatarFallback>
                                </Avatar>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-sm text-gray-900 truncate">
                                      {review.fromUser.name || 'Anonymous'}
                                    </span>
                                    </div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs text-gray-500">Client</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center">
                                      {renderStars(review.rating)}
                                    </div>
                                    <span className="text-xs text-gray-500">
                                      {formatDate(review.createdAt)}
                                    </span>
                                  </div>
                                </div>
                          </div>
                        </CardContent>
                      </Card>
                        );
                      })}
                                    </div>
                                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 px-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                      <Star className="h-12 w-12 text-gray-400 mb-3" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">No reviews yet</h3>
                      <p className="text-sm text-gray-500 text-center">
                        This developer hasn't received any reviews yet.
                      </p>
                                    </div>
                                  )}
                </div>

                {/* Services Section */}
                <div className="border-t border-gray-200 p-4 sm:p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Services</h3>
                    {totalServicesCount > 4 && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                        onClick={() => window.open(`/services?developer=${developerId}`, '_blank')}
                        className="text-sm text-gray-600 hover:text-gray-900"
                                    >
                        View all ({totalServicesCount})
                                    </Button>
                    )}
                                  </div>

                  {/* Services Grid */}
                  {servicesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-gray-500 text-sm">Loading services...</div>
                                </div>
                  ) : services.length > 0 ? (
                    <div className="overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
                      <div className="flex gap-4 pb-4" style={{ minWidth: 'max-content' }}>
                        {services.map((service) => {
                          const formatPrice = () => {
                            if (service.priceType === 'FIXED') {
                              if (service.priceMin && service.priceMax) {
                                return `$${service.priceMin.toLocaleString()} - $${service.priceMax.toLocaleString()}`;
                              }
                              return service.priceMin ? `$${service.priceMin.toLocaleString()}` : 'Contact for pricing';
                            } else if (service.priceType === 'HOURLY') {
                              return service.priceMin ? `$${service.priceMin}/hr` : 'Contact for pricing';
                            }
                            return 'Contact for pricing';
                          };

                          // Get all images for this service (avoid duplicates)
                          const getAllImages = () => {
                            const imageSet = new Set<string>();
                            if (service.coverUrl) imageSet.add(service.coverUrl);
                            if (service.galleryImages) {
                              service.galleryImages.filter(Boolean).forEach(img => imageSet.add(img));
                            }
                            if (service.showcaseImages) {
                              service.showcaseImages.filter(Boolean).forEach(img => imageSet.add(img));
                            }
                            return Array.from(imageSet);
                          };

                          const allImages = getAllImages();
                          const currentImageIndex = serviceImageIndices[service.id] || 0;

                          return (
                            <Card
                              key={service.id}
                              className="flex-shrink-0 w-[280px] sm:w-[320px] border-gray-200 shadow-sm hover:shadow-xl hover:border-gray-300 transition-all duration-300 cursor-pointer group hover:scale-[1.03] active:scale-[1.01]"
                              onClick={() => window.open(`/services/${service.slug}`, '_blank')}
                            >
                              <CardContent className="p-0 h-full flex flex-col">
                                {/* Service Preview Image Carousel with Slide-Up Animation */}
                                <div className="relative h-40 w-full overflow-hidden rounded-t-lg bg-gray-100">
                                  {allImages.length > 0 ? (
                                    <div className="relative w-full h-full">
                                      {allImages.map((imageUrl, imgIdx) => {
                                        const isActive = imgIdx === currentImageIndex;
                                        const prevIndex = currentImageIndex === 0 ? allImages.length - 1 : currentImageIndex - 1;
                                        const isPrevious = imgIdx === prevIndex;
                                        const nextIndex = (currentImageIndex + 1) % allImages.length;
                                        const isNext = imgIdx === nextIndex;
                                        
                                        // Calculate position for smooth slide-up animation
                                        let transformClass = '';
                                        let opacityClass = '';
                                        let zIndex = 0;
                                        
                                        if (isActive) {
                                          // Active image: visible at center
                                          transformClass = 'translate-y-0';
                                          opacityClass = 'opacity-100';
                                          zIndex = 20;
                                        } else if (isNext) {
                                          // Next image: positioned below, ready to slide up
                                          transformClass = 'translate-y-full';
                                          opacityClass = 'opacity-0';
                                          zIndex = 15;
                                        } else if (isPrevious) {
                                          // Previous image: slide up and fade out
                                          transformClass = '-translate-y-full';
                                          opacityClass = 'opacity-0';
                                          zIndex = 10;
                                        } else {
                                          // Other images: hidden below
                                          transformClass = 'translate-y-full';
                                          opacityClass = 'opacity-0';
                                          zIndex = 0;
                                        }
                                        
                                        return (
                                          <div
                                            key={`${service.id}-${imgIdx}-${imageUrl}`}
                                            className={`absolute inset-0 w-full h-full transition-all duration-700 ease-in-out ${transformClass} ${opacityClass}`}
                                            style={{ zIndex }}
                                          >
                                            <img
                                              src={imageUrl}
                                              alt={`${service.title} - Image ${imgIdx + 1}`}
                                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                              loading="lazy"
                                              onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                              }}
                                            />
                                  </div>
                                        );
                                      })}
                        </div>
                      ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                      <Briefcase className="h-12 w-12 text-gray-400" />
                            </div>
                                  )}
                                </div>

                                {/* Content */}
                                <div className="p-4 flex-1 flex flex-col">
                                  {/* Skills Badges */}
                                  {service.skills && service.skills.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                      {service.skills.slice(0, 3).map((skill, idx) => (
                                        <Badge
                                          key={idx}
                                          variant="secondary"
                                          className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        >
                                          {skill}
                                        </Badge>
                                      ))}
                                      {service.skills.length > 3 && (
                                        <Badge
                                          variant="secondary"
                                          className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700"
                                        >
                                          +{service.skills.length - 3}
                                        </Badge>
                                  )}
                                </div>
                                  )}

                                  {/* Service Title */}
                                  <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm sm:text-base">
                                    {service.title}
                                  </h4>

                                  {/* Pricing */}
                                  <div className="mt-auto pt-2">
                                    <p className="text-sm font-medium text-gray-900">
                                      {formatPrice()}
                                  </p>
                                </div>
                            </div>
                          </CardContent>
                        </Card>
                          );
                        })}
                                  </div>
                                </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 px-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                      <Briefcase className="h-10 w-10 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 text-center">No services available</p>
                            </div>
                      )}
                  </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-500 mb-4">Failed to load profile</p>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Auth Required Modal */}
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        action="contact this developer"
      />
    </div>
    </>
  );
}
