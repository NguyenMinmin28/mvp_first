"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { GetInTouchButton } from "@/features/shared/components/get-in-touch-button";
import Image from "next/image";
import dynamic from "next/dynamic";
const ServiceDetailOverlay = dynamic(() => import("./ServiceDetailOverlay"), { ssr: false, loading: () => <div className="h-80 w-full animate-pulse bg-gray-100" /> });
import { useInfiniteScroll, useScrollInfiniteLoad } from "@/core/hooks/useInfiniteScroll";
const DeveloperReviewsModal = dynamic(() => import("@/features/client/components/developer-reviews-modal"), { ssr: false, loading: () => <div className="h-48 w-full animate-pulse bg-gray-100" /> });

interface Service {
  id: string;
  slug: string;
  title: string;
  shortDesc: string;
  coverUrl?: string | null;
  priceType: string;
  priceMin?: number | null;
  priceMax?: number | null;
  deliveryDays?: number | null;
  ratingAvg: number;
  ratingCount: number;
  views: number;
  likesCount?: number;
  userLiked?: boolean;
  status?: string;
  developer: {
    id: string;
    user: {
      name?: string | null;
      image?: string | null;
    };
    location?: string | null;
  };
  skills: string[];
  categories: string[];
  leadsCount: number;
  galleryImages?: string[];
  showcaseImages?: string[];
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface ServicesGridProps {
  searchQuery?: string;
  sortBy?: string;
  filters?: string[];
  isDeveloper?: boolean;
}

export function ServicesGrid({ searchQuery = "", sortBy = "popular", filters = [], isDeveloper = false }: ServicesGridProps) {
  const { data: session } = useSession();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [showReviews, setShowReviews] = useState<{ open: boolean; developerId?: string; developerName?: string }>({ open: false });

  // Temporary: Use simple state for debugging
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  // Create fetch function với optimized API
  const fetchServices = useCallback(async (page: number, limit: number, cursor?: string) => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      sort: sortBy,
    });
    
    if (searchQuery.trim()) {
      params.append("search", searchQuery.trim());
    }
    
    // Handle "My Services" filter for developers
    if (isDeveloper && filters.includes("My Services")) {
      params.append("myServices", "true");
    }
    
    // Add cursor for keyset pagination
    if (cursor) {
      params.append("cursor", cursor);
    }
    
    
    try {
      const res = await fetch(`/api/services/optimized?${params.toString()}`, { 
        cache: "no-store",
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const json = await res.json();
      
      
      if (res.ok && json?.success) {
        return {
          data: json.data || [],
          pagination: json.pagination || {
            hasNextPage: false,
            nextCursor: null,
            limit
          }
        };
      }
    } catch (error) {
      console.warn('⚠️ Optimized API failed, falling back to original API:', error);
    }
    
    // Fallback to original API
    console.log('🔄 Falling back to original API:', `/api/services?${params.toString()}`);
    const fallbackParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort: sortBy,
    });
    
    if (searchQuery.trim()) {
      fallbackParams.append("search", searchQuery.trim());
    }
    
    if (isDeveloper && filters.includes("My Services")) {
      fallbackParams.append("myServices", "true");
    }
    
    const res = await fetch(`/api/services?${fallbackParams.toString()}`, { cache: "no-store" });
    const json = await res.json();
    
    if (!res.ok || !json?.success) {
      throw new Error(json?.message || 'Failed to fetch services');
    }
    
    return {
      data: json.data || [],
      pagination: json.pagination || {
        hasNextPage: false,
        nextCursor: null,
        limit
      }
    };
  }, [searchQuery, sortBy, isDeveloper, filters]);

  // Load initial data với optimized API
  useEffect(() => {
    let mounted = true;
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchServices(1, 12);
        if (mounted) {
          // Deduplicate initial data as well
          const uniqueServices = result.data.filter((service: Service, index: number, self: Service[]) => 
            index === self.findIndex((s: Service) => s.id === service.id)
          );
          setServices(uniqueServices);
          setHasNextPage(result.pagination.hasNextPage);
          setNextCursor(result.pagination.nextCursor);
          setCurrentPage(1);
          console.log('✅ Initial services loaded:', uniqueServices.length, 'nextCursor:', result.pagination.nextCursor);
        }
      } catch (err) {
        if (mounted) {
          console.error('❌ Error loading services:', err);
          setError('Failed to load services');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadInitialData();
    return () => { mounted = false; };
  }, [fetchServices]);

  // Listen for deep-link open events
  useEffect(() => {
    const handler = async (e: any) => {
      const serviceId = e?.detail?.serviceId as string | undefined;
      if (!serviceId) return;
      try {
        const res = await fetch(`/api/services/${serviceId}`);
        const json = await res.json();
        if (res.ok && json?.success) {
          setSelectedService(json.data);
          setIsOverlayOpen(true);
        }
      } catch {}
    };
    window.addEventListener("open-service-overlay", handler as any);
    return () => window.removeEventListener("open-service-overlay", handler as any);
  }, []);

  // Listen for developer service open events
  useEffect(() => {
    const handler = async (e: any) => {
      const { developerId, serviceId } = e?.detail || {};
      console.log("🔔 Received open-developer-service event:", { developerId, serviceId });
      if (!developerId || !serviceId) {
        console.log("🔔 Missing developerId or serviceId");
        return;
      }
      try {
        console.log("🔔 Fetching developer services for:", developerId);
        // Fetch developer's services to find the specific service
        const res = await fetch(`/api/developers/${developerId}/services?limit=10`);
        const json = await res.json();
        console.log("🔔 Developer services response:", { status: res.status, json });
        if (res.ok && json?.success && Array.isArray(json.data)) {
          console.log("🔔 All services from developer:", json.data);
          const targetService = json.data.find((s: any) => s.id === serviceId);
          console.log("🔔 Found target service:", targetService);
          if (targetService) {
            console.log("🔔 Setting selected service and opening overlay...");
            setSelectedService(targetService);
            setIsOverlayOpen(true);
            console.log("🔔 Service overlay should be open now");
          } else {
            console.log("🔔 Target service not found in developer's services");
            console.log("🔔 Available service IDs:", json.data.map((s: any) => s.id));
          }
        } else {
          console.log("🔔 Failed to fetch developer services or invalid response");
        }
      } catch (error) {
        console.error("🔔 Error in open-developer-service handler:", error);
      }
    };
    window.addEventListener("open-developer-service", handler as any);
    return () => window.removeEventListener("open-developer-service", handler as any);
  }, []);

  // Load more function - simplified without scroll position manipulation
  const loadMore = useCallback(async () => {
    console.log('🔄 loadMore called:', { loadingMore, hasNextPage, nextCursor, currentPage });
    if (loadingMore || !hasNextPage) {
      console.log('❌ loadMore blocked:', { loadingMore, hasNextPage });
      return;
    }
    
    try {
      setLoadingMore(true);
      console.log('🔄 Loading more services with cursor:', nextCursor);
      const result = await fetchServices(currentPage + 1, 12, nextCursor || undefined);
      
      // Update state directly - scroll is disabled during loading
      setServices(prev => {
        // Deduplicate by service ID
        const existingIds = new Set(prev.map(s => s.id));
        const newServices = result.data.filter((service: Service) => !existingIds.has(service.id));
        console.log('📊 Services update:', { 
          prevCount: prev.length, 
          newCount: newServices.length, 
          totalAfter: prev.length + newServices.length 
        });
        return [...prev, ...newServices];
      });
      setHasNextPage(result.pagination.hasNextPage);
      setNextCursor(result.pagination.nextCursor);
      setCurrentPage(prev => prev + 1);
      console.log('✅ More services loaded:', result.data.length, 'nextCursor:', result.pagination.nextCursor, 'hasNextPage:', result.pagination.hasNextPage);
    } catch (err) {
      console.error('Error loading more services:', err);
      setError('Failed to load more services');
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasNextPage, nextCursor, currentPage, fetchServices]);

  // Set up scroll-based loading with better debugging
  useScrollInfiniteLoad(loadMore, hasNextPage, loadingMore, 200);

  // Alternative scroll detection as backup
  useEffect(() => {
    const handleScroll = () => {
      if (loadingMore || !hasNextPage) return;
      
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Trigger when user is 300px from bottom
      if (scrollTop + windowHeight >= documentHeight - 300) {
        console.log('🔄 Scroll-based loadMore triggered');
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore, hasNextPage, loadingMore]);


  const handleOpenOverlay = (service: Service) => {
    setSelectedService(service);
    setIsOverlayOpen(true);
  };


  const handleServiceUpdate = (updatedService: any) => {
    // Note: This would need to be updated to work with the infinite scroll data
    // For now, we'll just update the selected service
    if (selectedService && selectedService.id === updatedService.id) {
      setSelectedService({
        ...selectedService,
        likesCount: updatedService.likesCount,
        userLiked: updatedService.userLiked,
      });
    }
  };

  if (loading && services.length === 0) {
    return (
      <div className="space-y-4">
        {searchQuery && (
          <div className="text-center py-4">
            <div className="text-gray-500 text-sm">
              Searching for "{searchQuery}"...
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, idx) => (
            <Card key={idx} className="border border-gray-200">
              <CardContent className="p-0">
                <div className="h-48 bg-gray-200 animate-pulse" />
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse" />
                    <div>
                      <div className="h-4 w-24 bg-gray-200 animate-pulse mb-2" />
                      <div className="h-3 w-16 bg-gray-200 animate-pulse" />
                    </div>
                  </div>
                  <div className="h-4 w-full bg-gray-200 animate-pulse mb-2" />
                  <div className="h-3 w-3/4 bg-gray-200 animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!services.length && !loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-2">
          {searchQuery ? "No services found matching your search" : "No services available"}
        </div>
        {searchQuery && (
          <div className="text-gray-400 text-sm">
            Try adjusting your search terms or filters
          </div>
        )}
      </div>
    );
  }

  return (
    <>
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
                Found <span className="font-semibold text-gray-900">{totalCount}</span> services for "
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

      {loading && services.length > 0 && (
        <div className="text-center py-2 mb-4">
          <div className="text-gray-500 text-sm">
            Updating results...
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {services.map((service, index) => (
          <Card 
            key={service.id} 
            className="hover:shadow-xl transition-all duration-500 border border-gray-200 h-full cursor-pointer transform hover:scale-105 hover:-translate-y-2 group overflow-hidden" 
            onClick={() => handleOpenOverlay(service)}
            style={{
              animationDelay: `${index * 100}ms`,
              animation: 'fadeInUp 0.6s ease-out forwards'
            }}
          >
            <CardContent className="p-0 h-full flex flex-col">
              {/* Cover Image with enhanced effects */}
              <div className="relative h-48 w-full overflow-hidden rounded-t-lg group/image">
                {service.coverUrl ? (
                  <>
                    <Image 
                      src={service.coverUrl} 
                      alt={service.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover/image:scale-110"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300"></div>
                    {/* Hover content */}
                    <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover/image:opacity-100 transition-all duration-300 transform translate-y-4 group-hover/image:translate-y-0">
                      <div className="text-sm font-medium">View Details</div>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center group-hover/image:from-blue-200 group-hover/image:to-purple-300 transition-all duration-500">
                    <span className="text-gray-400 text-sm group-hover/image:text-gray-600 transition-colors">No Image</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col">
                {/* Developer Info with enhanced animations */}
                <div className="flex items-center gap-3 mb-4 group/dev">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 ring-2 ring-transparent group-hover/dev:ring-blue-200 transition-all duration-300">
                    {service.developer.user.image ? (
                      <Image 
                        src={service.developer.user.image} 
                        alt={service.developer.user.name || "Developer"} 
                        width={48} 
                        height={48} 
                        className="object-cover w-12 h-12 transition-transform duration-300 group-hover/dev:scale-110" 
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-200 to-purple-300 group-hover/dev:from-blue-300 group-hover/dev:to-purple-400 transition-all duration-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 leading-tight group-hover/dev:text-blue-600 transition-colors duration-300">
                      {service.developer.user.name || "Unknown"}
                    </div>
                    <div className="text-xs text-gray-500 group-hover/dev:text-gray-600 transition-colors duration-300">
                      {service.developer.location || ""}
                    </div>
                  </div>
                </div>

                {/* Service Title with enhanced animations */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900 text-lg line-clamp-2 flex-1 group-hover:text-blue-600 transition-colors duration-300">
                    {service.title}
                  </h3>
                  {service.status && service.status === 'DRAFT' && (
                    <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full flex-shrink-0 animate-pulse">
                      Draft
                    </span>
                  )}
                </div>

                {/* Stats with enhanced animations */}
                <div className="flex items-center justify-between mb-4 text-sm">
                  <div className="group/rating">
                    <div className="font-semibold leading-tight group-hover/rating:text-blue-600 transition-colors duration-300">{service.ratingAvg.toFixed(1)}</div>
                    <div className="mt-1 flex items-center">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const ratingValue = Math.floor(service.ratingAvg);
                        const filled = i < ratingValue;
                        return (
                          <span
                            key={i}
                            className={`text-[10px] transition-all duration-300 ${filled ? "text-red-500 group-hover/rating:text-yellow-500" : "text-gray-300"} mr-0.5`}
                            style={{ animationDelay: `${i * 100}ms` }}
                          >
                            ★
                          </span>
                        );
                      })}
                      <button
                        type="button"
                        className="ml-2 text-gray-600 text-xs sm:text-sm hover:underline hover:text-blue-600 transition-colors duration-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowReviews({ open: true, developerId: service.developer.id, developerName: service.developer.user.name || "Developer" });
                        }}
                      >
                        ({service.ratingCount} reviews)
                      </button>
                    </div>
                  </div>
                  <div className="group/leads">
                    <div className="font-semibold group-hover/leads:text-green-600 transition-colors duration-300">{service.leadsCount}</div>
                    <div className="text-xs text-gray-500 group-hover/leads:text-gray-600 transition-colors duration-300">Leads</div>
                  </div>
                  <div className="group/price">
                    <div className="font-semibold group-hover/price:text-purple-600 transition-colors duration-300">
                      {service.priceType === "FIXED" 
                        ? `$${service.priceMin || 0}`
                        : `$${service.priceMin || 0}/h`
                      }
                    </div>
                    <div className="text-xs text-gray-500 group-hover/price:text-gray-600 transition-colors duration-300">Price</div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-1">
                  {service.shortDesc}
                </p>

                {/* Get in Touch Button - Hidden for developers */}
                {session?.user?.role !== "DEVELOPER" && (
                  <GetInTouchButton
                    developerId={service.developer.id}
                    developerName={service.developer.user.name || undefined}
                    className="w-full mt-auto border border-[#838383] bg-transparent hover:bg-gray-50 text-gray-900 transition-all duration-300 transform hover:scale-105 hover:shadow-md group/button"
                    variant="outline"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loading more indicator with skeleton */}
      {loadingMore && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={`loading-${i}`} className="bg-white rounded-2xl border p-6 animate-pulse">
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-8 bg-gray-200 rounded w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More Button - Manual backup */}
      {hasNextPage && !loadingMore && (
        <div className="text-center py-8">
          <Button 
            onClick={loadMore}
            variant="outline"
            className="px-8 py-3 text-lg font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
          >
            Load More Services
          </Button>
        </div>
      )}

      {/* End of results indicator */}
      {!hasNextPage && services.length > 0 && (
        <div className="text-center py-8">
          <div className="text-sm text-gray-500">
            You've reached the end of the results
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">{error}</div>
          <Button onClick={loadMore} variant="outline">
            Try Again
          </Button>
        </div>
      )}

      {/* Slide-in overlay for service detail */}
      <ServiceDetailOverlay
        isOpen={isOverlayOpen}
        service={selectedService ? { ...selectedService, likesCount: selectedService.likesCount, } as any : null}
        onClose={() => setIsOverlayOpen(false)}
        onGetInTouch={() => {
          // GetInTouchButton will handle the modal display
          console.log("Get in Touch clicked from overlay");
        }}
        onPrev={() => {
          if (!selectedService) return;
          const idx = services.findIndex(s => s.id === selectedService.id);
          if (idx === -1) return;
          const prev = services[(idx - 1 + services.length) % services.length];
          setSelectedService(prev);
        }}
        onNext={() => {
          if (!selectedService) return;
          const idx = services.findIndex(s => s.id === selectedService.id);
          if (idx === -1) return;
          const next = services[(idx + 1) % services.length];
          setSelectedService(next);
        }}
        onFollow={() => {
          // Placeholder: implement follow later
        }}
        onServiceUpdate={handleServiceUpdate}
      />


      {/* Developer Reviews Overlay */}
      {showReviews.open && showReviews.developerId && (
        <DeveloperReviewsModal
          isOpen={showReviews.open}
          onClose={() => setShowReviews({ open: false })}
          developerId={showReviews.developerId}
          developerName={showReviews.developerName || "Developer"}
        />
      )}
    </>
  );
}

export default ServicesGrid;

