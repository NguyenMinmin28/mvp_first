"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import Image from "next/image";
import GetInTouchModal from "./GetInTouchModal";
import ServiceDetailOverlay from "./ServiceDetailOverlay";
import { Pagination } from "@/features/shared/components/pagination";

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
  developer: {
    id: string;
    name?: string | null;
    image?: string | null;
    location?: string | null;
  };
  skills: string[];
  categories: string[];
  leadsCount: number;
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
}

export function ServicesGrid({ searchQuery = "", sortBy = "popular", filters = [] }: ServicesGridProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 12,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [searchQuery, sortBy, filters]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        
        // Build query parameters
        const params = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
          sort: sortBy,
        });
        
        if (searchQuery.trim()) {
          params.append("search", searchQuery.trim());
        }
        
        const res = await fetch(`/api/services?${params.toString()}`, { cache: "no-store" });
        const json = await res.json();
        if (res.ok && json?.success && Array.isArray(json.data) && mounted) {
          setServices(json.data);
          if (json.pagination) {
            setPagination(json.pagination);
          }
        }
      } catch (e) {
        console.error("Error loading services:", e);
      } finally {
        mounted && setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [pagination.page, searchQuery, sortBy, filters]);

  const handleGetInTouch = (service: Service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handleOpenOverlay = (service: Service) => {
    setSelectedService(service);
    setIsOverlayOpen(true);
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleServiceUpdate = (updatedService: any) => {
    setServices(prev => prev.map(service => 
      service.id === updatedService.id ? {
        ...service,
        likesCount: updatedService.likesCount,
        userLiked: updatedService.userLiked,
      } : service
    ));
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
            ) : pagination.totalCount > 0 ? (
              <>
                Found <span className="font-semibold text-gray-900">{pagination.totalCount}</span> services for "
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
                    {service.developer.image ? (
                      <Image 
                        src={service.developer.image} 
                        alt={service.developer.name || "Developer"} 
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
                      {service.developer.name || "Unknown"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {service.developer.location || ""}
                    </div>
                  </div>
                </div>

                {/* Service Title */}
                <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2">
                  {service.title}
                </h3>

                {/* Stats */}
                <div className="flex items-center justify-between mb-4 text-sm">
                  <div>
                    <div className="font-semibold leading-tight">{service.ratingAvg.toFixed(1)}</div>
                    <div className="mt-1 flex items-center">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const ratingValue = Math.round(service.ratingAvg);
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

                {/* Get in Touch Button */}
                <Button 
                  className="w-full mt-auto border border-[#838383] bg-transparent hover:bg-gray-50 text-gray-900" 
                  variant="outline"
                  onClick={(e) => { e.stopPropagation(); handleGetInTouch(service); }}
                >
                  Get in Touch
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
        totalCount={pagination.totalCount}
        limit={pagination.limit}
      />

      {/* Slide-in overlay for service detail */}
      <ServiceDetailOverlay
        isOpen={isOverlayOpen}
        service={selectedService ? { ...selectedService, likesCount: selectedService.likesCount, } as any : null}
        onClose={() => setIsOverlayOpen(false)}
        onGetInTouch={() => selectedService && handleGetInTouch(selectedService)}
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

      {selectedService && (
        <GetInTouchModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedService(null);
          }}
          serviceId={selectedService.id}
          serviceTitle={selectedService.title}
          developerName={selectedService.developer.name || undefined}
        />
      )}
    </>
  );
}

export default ServicesGrid;

