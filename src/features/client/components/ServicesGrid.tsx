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

  // Create fetch function
  const fetchServices = useCallback(async (page: number, limit: number) => {
    const params = new URLSearchParams({
      page: page.toString(),
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
    
    console.log('Fetching services:', `/api/services?${params.toString()}`);
    const res = await fetch(`/api/services?${params.toString()}`, { cache: "no-store" });
    const json = await res.json();
    
    console.log('Services API response:', { status: res.status, json });
    
    if (!res.ok || !json?.success) {
      throw new Error(json?.message || 'Failed to fetch services');
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
  }, [searchQuery, sortBy, isDeveloper, filters]);

  // Load initial data
  useEffect(() => {
    let mounted = true;
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchServices(1, 12);
        if (mounted) {
          setServices(result.data);
          setTotalCount(result.pagination.totalCount);
          setHasNextPage(result.pagination.hasNextPage);
          setCurrentPage(1);
        }
      } catch (err) {
        if (mounted) {
          console.error('Error loading services:', err);
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

  // Load more function
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasNextPage) return;
    
    try {
      setLoadingMore(true);
      const result = await fetchServices(currentPage + 1, 12);
      setServices(prev => [...prev, ...result.data]);
      setHasNextPage(result.pagination.hasNextPage);
      setCurrentPage(prev => prev + 1);
    } catch (err) {
      console.error('Error loading more services:', err);
      setError('Failed to load more services');
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasNextPage, currentPage, fetchServices]);

  // Set up scroll-based loading
  useScrollInfiniteLoad(loadMore, hasNextPage, loadingMore, 200);


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
        {services.map((service) => (
          <Card key={service.id} className="hover:shadow-md transition-shadow border border-gray-200 h-full cursor-pointer" onClick={() => handleOpenOverlay(service)}>
            <CardContent className="p-0 h-full flex flex-col">
              {/* Cover Image */}
              <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                {service.coverUrl ? (
                  <Image 
                    src={service.coverUrl} 
                    alt={service.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">No Image</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col">
                {/* Developer Info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                    {service.developer.user.image ? (
                      <Image 
                        src={service.developer.user.image} 
                        alt={service.developer.user.name || "Developer"} 
                        width={48} 
                        height={48} 
                        className="object-cover w-12 h-12" 
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 leading-tight">
                      {service.developer.user.name || "Unknown"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {service.developer.location || ""}
                    </div>
                  </div>
                </div>

                {/* Service Title */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900 text-lg line-clamp-2 flex-1">
                    {service.title}
                  </h3>
                  {service.status && service.status === 'DRAFT' && (
                    <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full flex-shrink-0">
                      Draft
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between mb-4 text-sm">
                  <div>
                    <div className="font-semibold leading-tight">{service.ratingAvg.toFixed(1)}</div>
                    <div className="mt-1 flex items-center">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const ratingValue = Math.floor(service.ratingAvg);
                        const filled = i < ratingValue;
                        return (
                          <span
                            key={i}
                            className={`text-[10px] ${filled ? "text-red-500" : "text-gray-300"} mr-0.5`}
                          >
                            ★
                          </span>
                        );
                      })}
                      <button
                        type="button"
                        className="ml-2 text-gray-600 text-xs sm:text-sm hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowReviews({ open: true, developerId: service.developer.id, developerName: service.developer.user.name || "Developer" });
                        }}
                      >
                        ({service.ratingCount} reviews)
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold">{service.leadsCount}</div>
                    <div className="text-xs text-gray-500">Leads</div>
                  </div>
                  <div>
                    <div className="font-semibold">
                      {service.priceType === "FIXED" 
                        ? `$${service.priceMin || 0}`
                        : `$${service.priceMin || 0}/h`
                      }
                    </div>
                    <div className="text-xs text-gray-500">Price</div>
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
                    className="w-full mt-auto border border-[#838383] bg-transparent hover:bg-gray-50 text-gray-900"
                    variant="outline"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loading more indicator */}
      {loadingMore && (
        <div className="flex justify-center py-8">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            <span className="text-sm text-gray-600">Loading more services...</span>
          </div>
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

