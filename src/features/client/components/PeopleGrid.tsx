"use client";

import { useState, useEffect } from "react";
import { useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/components/button";
import { Badge } from "@/ui/components/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/components/avatar";
import { Heart, MessageCircle, Star, MapPin, Clock, DollarSign, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Suspense, useCallback, memo, useMemo } from "react";
import type { ServiceDetailData } from "@/features/client/components/ServiceDetailOverlay";
import { toast } from "sonner";
import { GetInTouchButton } from "@/features/shared/components/get-in-touch-button";
import { GetInTouchModal } from "@/features/client/components/GetInTouchModal";
import { useInfiniteScroll, useScrollInfiniteLoad } from "@/core/hooks/useInfiniteScroll";

const ServiceDetailOverlay = dynamic(
  () => import("@/features/client/components/ServiceDetailOverlay"),
  { ssr: false, loading: () => <div className="p-4 text-sm text-gray-600">Loading…</div> }
);

function DevelopersSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border p-4 sm:p-6 animate-pulse">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex items-start space-x-3 sm:space-x-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="h-5 sm:h-6 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/4 mb-2" />
                <div className="flex space-x-2 sm:space-x-4">
                  <div className="h-3 sm:h-4 bg-gray-200 rounded w-16" />
                  <div className="h-3 sm:h-4 bg-gray-200 rounded w-12" />
                  <div className="h-3 sm:h-4 bg-gray-200 rounded w-14" />
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
              <div className="h-8 bg-gray-200 rounded w-full sm:w-28" />
              <div className="h-8 bg-gray-200 rounded w-full sm:w-28" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export interface Developer {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  bio?: string;
  location?: string;
  hourlyRateUsd?: number;
  ratingAvg?: number;
  ratingCount?: number;
  views?: number;
  likesCount?: number;
  userLiked?: boolean;
  level?: "FRESHER" | "MID" | "EXPERT";
  skills: Array<{
    skill: {
      id: string;
      name: string;
    };
  }>;
  services?: Array<{
    id: string;
    title: string;
    shortDesc: string;
    priceMin: number;
    priceMax: number;
    priceType: string;
    coverUrl?: string;
    ratingAvg: number;
    ratingCount: number;
    views: number;
    likesCount: number;
  }>;
  createdAt: string;
}

export interface DeveloperService {
  id: string;
  title: string;
  coverUrl?: string;
  priceMin: number;
  priceMax: number;
  priceType: string;
  ratingAvg: number;
  ratingCount: number;
  views: number;
  likesCount: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface PeopleGridProps {
  searchQuery?: string;
  sortBy?: string;
  filters?: string[];
  overrideDevelopers?: Developer[]; // when provided, render these instead of fetching
  autoRefreshEnabled?: boolean;
  onAutoRefreshToggle?: (enabled: boolean) => void;
  freelancerResponseStatuses?: Record<string, string>; // developerId -> responseStatus
  freelancerDeadlines?: Record<string, string>; // developerId -> acceptanceDeadline
  onGenerateNewBatch?: () => Promise<void>; // Function to generate new batch
  locked?: boolean; // Lock UI actions
  projectId?: string; // Project ID for contact system
  hideHeaderControls?: boolean; // Hide internal filter toolbar & level tabs
}

export function PeopleGrid({ 
  searchQuery = "", 
  sortBy = "popular", 
  filters, 
  overrideDevelopers, 
  autoRefreshEnabled: externalAutoRefresh, 
  onAutoRefreshToggle, 
  freelancerResponseStatuses, 
  freelancerDeadlines, 
  onGenerateNewBatch, 
  locked = false, 
  projectId,
  hideHeaderControls = false
}: PeopleGridProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [developerServices, setDeveloperServices] = useState<Record<string, DeveloperService[]>>({});
  const [selectedService, setSelectedService] = useState<ServiceDetailData | null>(null);
  const [isServiceOverlayOpen, setIsServiceOverlayOpen] = useState(false);
  const [selectedFreelancer, setSelectedFreelancer] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isOverride = Array.isArray(overrideDevelopers);
  
  // Internal state với fallback từ props
  const [internalAutoRefresh, setInternalAutoRefresh] = useState(externalAutoRefresh ?? true);
  
  // Reset state when projectId changes to avoid showing stale data
  const prevProjectIdRef = useRef(projectId);
  useEffect(() => {
    if (projectId !== prevProjectIdRef.current) {
      console.log('ProjectId changed, resetting PeopleGrid state');
      prevProjectIdRef.current = projectId;
    }
  }, [projectId]);

  // Sync với external state khi props thay đổi (chỉ khi external state thực sự thay đổi)
  const prevExternalRef = useRef(externalAutoRefresh);
  useEffect(() => {
    if (externalAutoRefresh !== undefined && externalAutoRefresh !== prevExternalRef.current) {
      console.log('Syncing external state:', externalAutoRefresh);
      setInternalAutoRefresh(externalAutoRefresh);
      prevExternalRef.current = externalAutoRefresh;
    }
  }, [externalAutoRefresh]);
  
  // Current state - sử dụng internal state để có immediate feedback
  const currentAutoRefresh = internalAutoRefresh;
  console.log('PeopleGrid render - currentAutoRefresh:', currentAutoRefresh, 'externalAutoRefresh:', externalAutoRefresh, 'internalAutoRefresh:', internalAutoRefresh);
  const pendingTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const abortControllersRef = useRef<Record<string, AbortController>>({});
  const [levelFilter, setLevelFilter] = useState<"all" | "beginner" | "professional" | "expert" | "ready">("all");
  const [timeRemaining, setTimeRemaining] = useState<Record<string, number>>({});
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  const [likedDeveloperIds, setLikedDeveloperIds] = useState<Set<string>>(new Set());
  const [pendingFollowIds, setPendingFollowIds] = useState<Set<string>>(new Set());
  const [followedUserIds, setFollowedUserIds] = useState<Set<string>>(new Set());
  
  // Fire-and-forget favorite request that survives navigation
  const backgroundFavorite = (developerId: string) => {
    try {
      const payload = JSON.stringify({ developerId });
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon('/api/user/favorites', blob);
        return;
      }
      // Fallback
      fetch('/api/user/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    } catch {}
  };
  
  // Handle toggle với immediate visual feedback
  const handleToggle = useCallback(() => {
    setInternalAutoRefresh(prev => {
      const newValue = !prev;
      console.log('handleToggle called:', { prev, newValue, externalAutoRefresh, internalAutoRefresh });
      
      // Gọi callback nếu có
      onAutoRefreshToggle?.(newValue);
      console.log('onAutoRefreshToggle called with:', newValue);
      
      return newValue;
    });
  }, [onAutoRefreshToggle, externalAutoRefresh, internalAutoRefresh]);

  const handleGenerateNewBatch = useCallback(async () => {
    if (!onGenerateNewBatch || isGeneratingBatch || locked) return;
    
    try {
      setIsGeneratingBatch(true);
      await onGenerateNewBatch();
    } catch (error) {
      console.error('Error generating new batch:', error);
    } finally {
      setIsGeneratingBatch(false);
    }
  }, [onGenerateNewBatch, isGeneratingBatch]);

  // Temporary: Use simple state for debugging (only when not using overrideDevelopers)
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Create fetch function
  const fetchDevelopers = useCallback(async (page: number, limit: number) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort: sortBy,
    });

    if (searchQuery.trim()) {
      params.append("search", searchQuery.trim());
    }

    console.log('Fetching developers:', `/api/developers?${params.toString()}`);
    const res = await fetch(`/api/developers?${params.toString()}` as RequestInfo, { cache: "no-store" } as RequestInit);
    const json = await res.json();
    
    console.log('Developers API response:', { status: res.status, json });
    
    if (!res.ok || !json?.success) {
      throw new Error(json?.message || 'Failed to fetch developers');
    }
    
    return {
      data: json.data || [],
      pagination: json.pagination || {
        page,
        limit,
        totalCount: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      }
    };
  }, [searchQuery, sortBy]);

  // Load initial data (only when not using overrideDevelopers)
  useEffect(() => {
    if (isOverride) {
      setLoading(false);
      return;
    }

    let mounted = true;
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchDevelopers(1, 12);
        if (mounted) {
          setDevelopers(result.data);
          setTotalCount(result.pagination.totalCount);
          setHasNextPage(result.pagination.hasNextPage);
          setCurrentPage(1);
        }
      } catch (err) {
        if (mounted) {
          console.error('Error loading developers:', err);
          setError('Failed to load developers');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadInitialData();
    return () => { mounted = false; };
  }, [fetchDevelopers, isOverride]);

  // After list loaded, check follow status in bulk (by userId) for both modes
  useEffect(() => {
    const list = (isOverride && Array.isArray(overrideDevelopers)) ? overrideDevelopers : developers;
    if (!Array.isArray(list) || list.length === 0) return;
    const userIds = list.map(d => d.user.id);
    (async () => {
      try {
        const res = await fetch('/api/user/follow/check-bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds }),
          cache: 'no-store'
        });
        if (!res.ok) return;
        const json = await res.json();
        const set = new Set<string>();
        Object.entries(json.map || {}).forEach(([uid, followed]) => {
          if (followed) set.add(uid);
        });
        setFollowedUserIds(set);
      } catch (e) {
        console.error('check-bulk follow failed', e);
      }
    })();
  }, [developers, overrideDevelopers, isOverride]);

  // Load more function
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasNextPage || isOverride) return;
    
    try {
      setLoadingMore(true);
      const result = await fetchDevelopers(currentPage + 1, 12);
      setDevelopers(prev => [...prev, ...result.data]);
      setHasNextPage(result.pagination.hasNextPage);
      setCurrentPage(prev => prev + 1);
    } catch (err) {
      console.error('Error loading more developers:', err);
      setError('Failed to load more developers');
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasNextPage, currentPage, fetchDevelopers, isOverride]);

  // Set up scroll-based loading (only when not using overrideDevelopers)
  useScrollInfiniteLoad(loadMore, hasNextPage, loadingMore, 200);


  // Decide which developer list to render
  const devList: Developer[] = (isOverride && Array.isArray(overrideDevelopers)) ? overrideDevelopers : developers;
  if (isOverride && Array.isArray(overrideDevelopers)) {
    console.log('PeopleGrid using overrideDevelopers, count:', overrideDevelopers.length);
  }
  
  // Filter developers based on level filter and remove duplicates
  const filteredDevList = useMemo(() => {
    // First, remove duplicates by ID
    const uniqueDevList = devList.filter((dev, index, self) => 
      index === self.findIndex(d => d.id === dev.id)
    );
    
    // Debug log to check for duplicates
    if (devList.length !== uniqueDevList.length) {
      console.log(`Removed ${devList.length - uniqueDevList.length} duplicate developers`);
    }
    
    if (levelFilter === "all") return uniqueDevList;
    
    return uniqueDevList.filter(dev => {
      switch (levelFilter) {
        case "beginner":
          // Beginner: FRESHER level
          return dev.level === "FRESHER";
        case "professional":
          // Professional: MID level
          return dev.level === "MID";
        case "expert":
          // Expert: EXPERT level
          return dev.level === "EXPERT";
        case "ready":
          // Ready to Work: has accepted the project (responseStatus === "accepted")
          const isAccepted = freelancerResponseStatuses?.[dev.id] === "accepted";
          console.log(`Developer ${dev.user.name} (${dev.id}) ready filter:`, {
            responseStatus: freelancerResponseStatuses?.[dev.id],
            isAccepted,
            allStatuses: freelancerResponseStatuses
          });
          return isAccepted;
        default:
          return true;
      }
    });
  }, [devList, levelFilter, freelancerResponseStatuses]);
  const devIdsKey = filteredDevList.map(d => d.id).join(',');

  // Countdown timer effect
  useEffect(() => {
    if (!freelancerDeadlines) return;

    const updateCountdowns = () => {
      const now = new Date().getTime();
      const newTimeRemaining: Record<string, number> = {};

      Object.entries(freelancerDeadlines).forEach(([developerId, deadline]) => {
        const deadlineTime = new Date(deadline).getTime();
        const remaining = Math.max(0, deadlineTime - now);
        newTimeRemaining[developerId] = remaining;
      });

      setTimeRemaining(newTimeRemaining);
    };

    // Update immediately
    updateCountdowns();

    // Update every second
    const interval = setInterval(updateCountdowns, 1000);

    return () => clearInterval(interval);
  }, [freelancerDeadlines]);

  // Fetch services for each developer when developer list changes
  useEffect(() => {
    // Cleanup any pending timeouts/requests from previous runs
    pendingTimeoutsRef.current.forEach(t => clearTimeout(t));
    pendingTimeoutsRef.current = [];
    Object.values(abortControllersRef.current).forEach(ctrl => ctrl.abort());
    abortControllersRef.current = {};

    if (filteredDevList.length === 0) return;

    const fetchWithAbort = async (developerId: string) => {
      if (developerServices[developerId]) return;
      const controller = new AbortController();
      abortControllersRef.current[developerId] = controller;
      try {
        await fetchDeveloperServices(developerId, controller.signal);
      } finally {
        delete abortControllersRef.current[developerId];
      }
    };

    if (isOverride) {
      // Prioritize fast initial render: fetch a few immediately, then batch the rest lazily
      const immediate = devList.slice(0, 6);
      const later = devList.slice(6);

      immediate.forEach(d => fetchWithAbort(d.id));

      // Batch remaining in chunks to avoid overwhelming network/UI
      const chunkSize = 5;
      let index = 0;
      while (index < later.length) {
        const chunk = later.slice(index, index + chunkSize);
        const timeout = setTimeout(() => {
          chunk.forEach(d => fetchWithAbort(d.id));
        }, 400 + (index / chunkSize) * 400);
        pendingTimeoutsRef.current.push(timeout);
        index += chunkSize;
      }
    } else {
      // For non-override mode, also batch to avoid network burst
      const immediate = filteredDevList.slice(0, 6);
      const later = filteredDevList.slice(6);
      immediate.forEach(d => fetchWithAbort(d.id));
      const chunkSize = 5;
      let index = 0;
      while (index < later.length) {
        const chunk = later.slice(index, index + chunkSize);
        const timeout = setTimeout(() => {
          chunk.forEach(d => fetchWithAbort(d.id));
        }, 300 + (index / chunkSize) * 300);
        pendingTimeoutsRef.current.push(timeout);
        index += chunkSize;
      }
    }

    return () => {
      pendingTimeoutsRef.current.forEach(t => clearTimeout(t));
      pendingTimeoutsRef.current = [];
      Object.values(abortControllersRef.current).forEach(ctrl => ctrl.abort());
      abortControllersRef.current = {};
    };
  }, [devIdsKey, isOverride]);


  const handleLike = async (developerId: string) => {
    // TODO: Implement like functionality for developers
    console.log("Like developer:", developerId);
  };

  const formatPrice = (min: number, max: number, type: string) => {
    if (type === "FIXED") {
      return `$${min} - $${max}`;
    } else if (type === "HOURLY") {
      return `$${min}/hr - $${max}/hr`;
    }
    return `$${min} - $${max}`;
  };

  const formatTimeRemaining = (milliseconds: number) => {
    if (milliseconds <= 0) return "Expired";
    
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const getFreelancerLevel = (developer: Developer) => {
    // Use the level field from API data
    const level = developer.level;
    
    // Debug log to check level data
    console.log(`Developer ${developer.user.name} level:`, level);
    
    switch (level) {
      case "EXPERT":
        return { level: "Expert", icon: "/images/client/exp.png" };
      case "MID":
        return { level: "Professional", icon: "/images/client/pro.png" };
      case "FRESHER":
        return { level: "Starter", icon: "/images/client/starter.png" };
      default:
        // Fallback to rating-based logic if level is not available
        console.log(`No level found for ${developer.user.name}, using fallback logic`);
        const rating = developer.ratingAvg || 0;
        const ratingCount = developer.ratingCount || 0;
        
        if (rating >= 4.5 && ratingCount >= 50) {
          return { level: "Expert", icon: "/images/client/exp.png" };
        } else if (rating >= 4.0 && ratingCount >= 10) {
          return { level: "Professional", icon: "/images/client/pro.png" };
        } else {
          return { level: "Starter", icon: "/images/client/starter.png" };
        }
    }
  };

  const fetchDeveloperServices = async (developerId: string, signal?: AbortSignal) => {
    try {
      const res = await fetch(`/api/developers/${developerId}/services?limit=4`, { cache: "no-store", signal });
      const json = await res.json();
      if (res.ok && json?.success && Array.isArray(json.data)) {
        setDeveloperServices(prev => ({
          ...prev,
          [developerId]: json.data
        }));
      }
    } catch (e) {
      if ((e as any)?.name === 'AbortError') return; // ignore aborted fetches
      console.error("Error loading developer services:", e);
    }
  };

  const handleServiceClick = async (service: DeveloperService, developer: Developer) => {
    console.log("Service clicked:", service.id, service.title);
    try {
      // Fetch full service details
      const res = await fetch(`/api/services/${service.id}`, { cache: "no-store" });
      const json = await res.json();
      
      console.log("API response:", res.status, json);
      
      if (res.ok && json?.success && json.data) {
        const serviceData: ServiceDetailData = {
          id: json.data.id,
          slug: json.data.slug,
          title: json.data.title,
          shortDesc: json.data.shortDesc,
          coverUrl: json.data.coverUrl,
          priceType: json.data.priceType,
          priceMin: json.data.priceMin,
          priceMax: json.data.priceMax,
          deliveryDays: json.data.deliveryDays,
          ratingAvg: json.data.ratingAvg,
          ratingCount: json.data.ratingCount,
          views: json.data.views,
          likesCount: json.data.likesCount,
          userLiked: json.data.userLiked,
          developer: {
            id: developer.id,
            user: {
              name: developer.user.name,
              image: developer.user.image,
            },
            location: developer.location,
          },
          skills: json.data.skills || [],
          categories: json.data.categories || [],
          leadsCount: json.data.leadsCount || 0,
          responseStatus: freelancerResponseStatuses?.[developer.id], // Add response status for project candidates
          galleryImages: json.data.galleryImages || [],
          showcaseImages: json.data.showcaseImages || [],
        };
        
        console.log("Opening overlay with service data:", serviceData);
        console.log("Response status for developer:", developer.id, "is:", freelancerResponseStatuses?.[developer.id]);
        setSelectedService(serviceData);
        setIsServiceOverlayOpen(true);
      } else {
        console.error("API error:", json);
      }
    } catch (e) {
      console.error("Error loading service details:", e);
    }
  };

  const handleDeveloperClick = (developer: Developer, e?: React.MouseEvent) => {
    // Only redirect to developer profile if not in project detail page
    if (!projectId) {
      router.push(`/developer/${developer.id}`);
    }
  };

  if (!isOverride && loading && filteredDevList.length === 0) {
    return (
      <DevelopersSkeleton />
    );
  }

  // Don't return early for empty results - show the full UI with empty state

  return (
    <>
      {/* Top toolbar: Filter button and controls */}
      {!hideHeaderControls && (
      <div className="mb-6 space-y-4">
        {/* First row: Filter button and action buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <button
            type="button"
            aria-label="Filter"
            onClick={(e) => {
              e.stopPropagation();
              console.log("Open filter drawer");
            }}
            className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-white border border-gray-200 shadow-[0_8px_20px_-10px_rgba(0,0,0,0.2)] hover:shadow-lg transition-shadow"
          >
            <SlidersHorizontal className="w-6 h-6 text-black" />
            <span className="text-lg font-bold text-black">Filter</span>
          </button>

          {/* Action buttons - positioned at the right on larger screens */}
          <div className="flex items-center gap-4 ml-auto">
          {/* Generate New Batch Button */}
          {onGenerateNewBatch && (
            <button
              type="button"
              onClick={handleGenerateNewBatch}
              disabled={isGeneratingBatch || locked}
              className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGeneratingBatch ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  New Batch
                </>
              )}
            </button>
          )}
          
          {/* Auto-refresh toggle
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Auto-refresh</span>
            <button
              type="button"
              role="switch"
              aria-checked={currentAutoRefresh}
              onClick={handleToggle}
              className={`relative inline-flex h-6 w-12 items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 ${
                currentAutoRefresh ? 'bg-black' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-all duration-300 ease-in-out ${
                  currentAutoRefresh ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div> */}
          </div>
        </div>

        {/* Level filter tabs - responsive layout */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          {[
            { key: "all", label: "All" },
            { key: "beginner", label: "Beginner" },
            { key: "professional", label: "Professional" },
            { key: "expert", label: "Expert" },
            { key: "ready", label: "Ready to Work" },
          ].map((opt) => {
            const selected = levelFilter === (opt.key as any);
            return (
              <button
                key={opt.key}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLevelFilter(opt.key as any);
                }}
                className={`px-3 py-2 sm:px-4 sm:py-2 sm:w-40 h-10 rounded-lg border transition-colors whitespace-nowrap flex items-center justify-center text-sm sm:text-base ${
                  selected
                    ? "bg-[#F5F6F9] border-gray-200"
                    : "bg-transparent border-transparent"
                }`}
                style={{ color: selected ? "#111827" : "#999999" }}
              >
                <span className="font-semibold">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      )}

      {/* Search results info */}
      {searchQuery && !loading && (
        <div className="mb-6">
          <div className="text-gray-600 text-sm">
            {searchQuery.length < 2 ? (
              <>
                <span className="text-amber-600">Please enter at least 2 characters to search</span>
              </>
            ) : totalCount > 0 ? (
              <>
                Found <span className="font-semibold text-gray-900">{totalCount}</span> developers for "
                <span className="font-semibold text-gray-900">"{searchQuery}"</span>"
              </>
            ) : (
              <>
                No results found for "<span className="font-semibold text-gray-900">"{searchQuery}"</span>"
                {searchQuery.length < 3 && (
                  <div className="text-xs text-gray-500 mt-1">
                    Try a longer search term for better results
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Loading indicator for search */}
      {loading && developers.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-2"></div>
            <span className="text-sm text-gray-600">Updating results...</span>
          </div>
        </div>
      )}

      {/* Approved Freelancers Section */}
      {/* {freelancerResponseStatuses && Object.values(freelancerResponseStatuses).some(status => status === 'accepted') && (
        <div className="mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <h3 className="font-semibold text-green-800">Approved Freelancers</h3>
            </div>
            <p className="text-sm text-green-700">
              These freelancers have accepted your project and are ready to work with you.
            </p>
          </div>
        </div>
      )} */}

      {/* Freelancers List - Row Layout (full height to avoid image cropping) */}
      <div className="space-y-6">
        {filteredDevList.length === 0 ? (
          <div className="text-center py-12">
            {isOverride ? (
              <>
                <div className="text-gray-500 text-lg mb-2">No candidates found</div>
                <p className="text-gray-400">There are no pending/accepted candidates in this batch.</p>
              </>
            ) : (
              <>
                <div className="text-gray-500 text-lg mb-2">Loading</div>
                <p className="text-gray-400">
                  {searchQuery ? `No results for "${searchQuery}"` : "Please wait for the results to load"}
                </p>
              </>
            )}
          </div>
        ) : (
          filteredDevList.map((developer, devIndex) => (
          <div
            key={developer.id}
            className={`bg-white rounded-2xl border transition-all duration-200 hover:shadow-lg group overflow-hidden ${
              freelancerResponseStatuses?.[developer.id] === 'accepted'
                ? 'border-green-500 border-2 hover:border-green-600'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onMouseEnter={() => router.prefetch(`/developer/${developer.id}`)}
          >
            {/* Freelancer Header Row */}
            <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  {/* Left: Avatar, Name, Stats */}
                  <div className="flex items-start space-x-3 sm:space-x-2 flex-1">
                    <div className="flex flex-col w-full">
                      <div className="flex items-start space-x-3">
                        <Avatar 
                          className="w-12 h-12 sm:w-16 sm:h-16 cursor-pointer flex-shrink-0"
                          onClick={() => handleDeveloperClick(developer)}
                        >
                          <AvatarImage 
                            src={developer.user.image || ''} 
                            alt={developer.user.name}
                            className="object-cover w-full h-full"
                            loading={devIndex < 4 ? "eager" : "lazy"}
                            decoding="async"
                          />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-sm sm:text-lg">
                            {developer.user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'D'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          {/* Name */}
                          <div className="mb-2">
                            <h3 
                              className="font-bold text-base sm:text-lg text-gray-900 group-hover:text-blue-600 transition-colors cursor-pointer truncate"
                              onClick={() => handleDeveloperClick(developer)}
                            >
                              {developer.user.name}
                            </h3>
                          </div>
                          
                          {/* PRO Badge, Location, Status and Countdown - responsive layout */}
                          <div className="space-y-2 sm:space-y-0">
                            {/* First row: PRO Badge and Location */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className="text-white text-xs font-medium px-2 py-0.5 rounded" style={{ backgroundColor: '#515151' }}>
                                PRO
                              </Badge>
                              <p className="text-xs sm:text-sm" style={{ color: '#999999' }}>
                                {developer.location || "Location not specified"}
                              </p>
                            </div>
                            
                            {/* Second row: Status and Countdown - show on mobile only; desktop shows at right column */}
                            <div className="flex items-center justify-between sm:justify-start sm:gap-2 sm:hidden">
                              {/* Freelancer Response Status Badge */}
                              {freelancerResponseStatuses?.[developer.id] && (
                                <Badge 
                                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                    freelancerResponseStatuses[developer.id] === 'accepted' 
                                      ? 'bg-green-500 text-white' 
                                      : freelancerResponseStatuses[developer.id] === 'rejected'
                                      ? 'bg-red-500 text-white'
                                      : freelancerResponseStatuses[developer.id] === 'expired'
                                      ? 'bg-gray-500 text-white'
                                      : 'bg-yellow-500 text-white'
                                  }`}
                                >
                                  {freelancerResponseStatuses[developer.id] === 'accepted' && '✅ Approved'}
                                  {freelancerResponseStatuses[developer.id] === 'rejected' && '❌ Rejected'}
                                  {freelancerResponseStatuses[developer.id] === 'expired' && '⏰ Expired'}
                                  {freelancerResponseStatuses[developer.id] === 'pending' && '⏳ Pending'}
                                </Badge>
                              )}
                              
                              {/* Countdown Timer - compact design */}
                              {freelancerDeadlines?.[developer.id] && (
                                <div className="flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                                  <Clock className="w-3 h-3 text-orange-500" />
                                  <span className="text-xs font-semibold text-orange-700">
                                    {formatTimeRemaining(timeRemaining[developer.id] || 0)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Stats Row below avatar - responsive */}
                      <div className="flex flex-col sm:flex-row sm:items-start mt-3 gap-3">
                        <div className="flex items-start space-x-4 sm:space-x-6 text-xs sm:text-sm">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">$100K+</span>
                            <span style={{ color: '#999999' }}>Earned</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">10x</span>
                            <span style={{ color: '#999999' }}>Hired</span>
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center">
                              <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-black text-black mr-1" />
                              <span className="font-bold text-gray-900">5.0</span>
                            </div>
                            <span style={{ color: '#999999' }}>Rating</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">523</span>
                            <span style={{ color: '#999999' }}>Followers</span>
                          </div>
                        </div>
                        
                        {/* Freelancer Level Badge */}
                        <div className="sm:ml-12 self-start sm:self-end">
                          {(() => {
                            const freelancerLevel = getFreelancerLevel(developer);
                            return (
                              <div className="flex items-center gap-2 px-3 py-1 sm:px-4 rounded border" style={{ backgroundColor: '#F9FAFB' }}>
                                <img 
                                  src={freelancerLevel.icon} 
                                  alt={freelancerLevel.level} 
                                  className="w-3 h-3 sm:w-4 sm:h-4 object-contain"
                                  loading={devIndex < 4 ? "eager" : "lazy"}
                                  decoding="async"
                                />
                                <span className="text-xs sm:text-sm font-medium text-gray-900">Top {freelancerLevel.level}</span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                {/* Right: Status/Countdown (desktop) + Action Buttons */}
                <div className="flex flex-col sm:flex-col items-stretch sm:items-end space-y-2 sm:space-y-3 w-full sm:w-auto">
                  {/* Desktop/laptop: Pending badge and countdown placed neatly at top right */}
                  <div className="hidden sm:flex items-center gap-2">
                    {freelancerResponseStatuses?.[developer.id] && (
                      <Badge 
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          freelancerResponseStatuses[developer.id] === 'accepted' 
                            ? 'bg-green-500 text-white' 
                            : freelancerResponseStatuses[developer.id] === 'rejected'
                            ? 'bg-red-500 text-white'
                            : freelancerResponseStatuses[developer.id] === 'expired'
                            ? 'bg-gray-500 text-white'
                            : 'bg-yellow-500 text-white'
                        }`}
                      >
                        {freelancerResponseStatuses[developer.id] === 'accepted' && '✅ Approved'}
                        {freelancerResponseStatuses[developer.id] === 'rejected' && '❌ Rejected'}
                        {freelancerResponseStatuses[developer.id] === 'expired' && '⏰ Expired'}
                        {freelancerResponseStatuses[developer.id] === 'pending' && '⏳ Pending'}
                      </Badge>
                    )}
                    {freelancerDeadlines?.[developer.id] && (
                      <div className="flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                        <Clock className="w-3 h-3 text-orange-500" />
                        <span className="text-xs font-semibold text-orange-700">
                          {formatTimeRemaining(timeRemaining[developer.id] || 0)}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                    {!(developer.userLiked || likedDeveloperIds.has(developer.id) || followedUserIds.has(developer.user.id)) && (
                      <Button
                        variant="outline"
                        className="w-full sm:w-28 border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
                        disabled={pendingFollowIds.has(developer.id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          e.nativeEvent.stopImmediatePropagation();
                          // Optimistic UI & toast
                          setLikedDeveloperIds(prev => new Set(prev).add(developer.id));
                          setFollowedUserIds(prev => new Set(prev).add(developer.user.id));
                          setPendingFollowIds(prev => new Set(prev).add(developer.id));
                          toast.success(`Following ${developer.user.name} - you'll get updates about their portfolio, reviews, and ideas!`);
                          // Fire-and-forget API that survives navigation
                          try {
                            const payload = JSON.stringify({ 
                              developerId: developer.user.id, 
                              action: "follow" 
                            });
                            if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
                              const blob = new Blob([payload], { type: 'application/json' });
                              navigator.sendBeacon('/api/user/follow', blob);
                            } else {
                              fetch('/api/user/follow', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: payload,
                                keepalive: true,
                              }).catch(() => {});
                            }
                          } catch {}
                        }}
                      >
                        Follow
                      </Button>
                    )}
                    <GetInTouchButton
                      developerId={developer.id}
                      developerName={developer.user.name || undefined}
                      projectId={projectId}
                      className="w-full sm:w-28 bg-black text-white hover:bg-gray-800 text-sm"
                      variant="default"
                      size="default"
                      responseStatus={projectId ? freelancerResponseStatuses?.[developer.id] : undefined}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Services Grid - 4 Services (Images Only) - responsive */}
            {developerServices[developer.id] && developerServices[developer.id].length > 0 && (
              <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="pt-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    {developerServices[developer.id].slice(0, 4).map((service, serviceIdx) => (
                      <div key={service.id} className="group/service">
                        <div 
                          className="relative w-full h-32 sm:h-56 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleServiceClick(service, developer);
                          }}
                        >
                          {service.coverUrl ? (
                            <img
                              src={service.coverUrl}
                              alt={service.title}
                              className="w-full h-full object-cover group-hover/service:scale-105 transition-transform duration-200"
                              loading={devIndex < 4 && serviceIdx < 2 ? "eager" : "lazy"}
                              decoding="async"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm sm:text-lg font-semibold">
                              {service.title.split(' ').map(word => word[0]).join('').substring(0, 2)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* View All Services Button */}
                  {developerServices[developer.id].length > 4 && (
                    <div className="text-center mt-3 sm:mt-4">
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-blue-600 hover:text-blue-700 text-sm sm:text-base"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleDeveloperClick(developer);
                        }}
                      >
                        View All {developerServices[developer.id].length} Services
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )))}
      </div>

      {/* Loading more indicator */}
      {!isOverride && loadingMore && (
        <div className="flex justify-center py-8">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            <span className="text-sm text-gray-600">Loading more developers...</span>
          </div>
        </div>
      )}

      {/* End of results indicator */}
      {!isOverride && !hasNextPage && filteredDevList.length > 0 && (
        <div className="text-center py-8">
          <div className="text-sm text-gray-500">
            You've reached the end of the results
          </div>
        </div>
      )}

      {/* Error state */}
      {!isOverride && error && (
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">{error}</div>
          <Button onClick={loadMore} variant="outline">
            Try Again
          </Button>
        </div>
      )}

      {/* Service Detail Overlay */}
      <ServiceDetailOverlay
        isOpen={isServiceOverlayOpen}
        service={selectedService}
        onClose={() => {
          setIsServiceOverlayOpen(false);
          setSelectedService(null);
        }}
        onGetInTouch={() => {
          // Close service overlay and open get in touch modal
          setIsServiceOverlayOpen(false);
          if (selectedService?.developer) {
            setSelectedFreelancer({
              id: selectedService.developer.id,
              name: selectedService.developer.user.name || "Developer"
            });
            setIsModalOpen(true);
          }
        }}
        onFollow={() => {
          // Handle follow action
          console.log("Follow developer:", selectedService?.developer?.id);
        }}
        onServiceUpdate={(updatedService) => {
          // Update service data if needed
          setSelectedService(updatedService);
        }}
        projectId={projectId}
      />

      {/* Get in Touch Modal */}
      {selectedFreelancer && (
        <GetInTouchModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedFreelancer(null);
          }}
          serviceId={selectedFreelancer.id}
          serviceTitle={selectedFreelancer.name || "Freelancer"}
          developerName={selectedFreelancer.name || undefined}
        />
      )}
    </>
  );
}

function areEqual(prev: PeopleGridProps, next: PeopleGridProps) {
  if (prev.searchQuery !== next.searchQuery) return false;
  if (prev.sortBy !== next.sortBy) return false;
  if (prev.projectId !== next.projectId) return false; // Add projectId comparison
  const prevFilters = prev.filters || [];
  const nextFilters = next.filters || [];
  if (prevFilters.length !== nextFilters.length) return false;
  for (let i = 0; i < prevFilters.length; i++) if (prevFilters[i] !== nextFilters[i]) return false;
  const prevDevs = prev.overrideDevelopers || [];
  const nextDevs = next.overrideDevelopers || [];
  if (prevDevs.length !== nextDevs.length) return false;
  for (let i = 0; i < prevDevs.length; i++) if (prevDevs[i].id !== nextDevs[i].id) return false;
  return true;
}

export default memo(PeopleGrid, areEqual);
