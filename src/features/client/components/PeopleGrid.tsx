"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/components/button";
import { Badge } from "@/ui/components/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/components/avatar";
import { Heart, MessageCircle, Star, MapPin, Clock, DollarSign } from "lucide-react";
import Link from "next/link";
import ServiceDetailOverlay, { ServiceDetailData } from "@/features/client/components/ServiceDetailOverlay";

interface Developer {
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

interface DeveloperService {
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
}

export function PeopleGrid({ searchQuery = "", sortBy = "popular", filters = [] }: PeopleGridProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);
  const [developerServices, setDeveloperServices] = useState<Record<string, DeveloperService[]>>({});
  const [selectedService, setSelectedService] = useState<ServiceDetailData | null>(null);
  const [isServiceOverlayOpen, setIsServiceOverlayOpen] = useState(false);
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
        
        const params = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
          sort: sortBy,
        });
        
        if (searchQuery.trim()) {
          params.append("search", searchQuery.trim());
        }
        
        const res = await fetch(`/api/developers?${params.toString()}`, { cache: "no-store" });
        const json = await res.json();
        if (res.ok && json?.success && Array.isArray(json.data) && mounted) {
          setDevelopers(json.data);
          if (json.pagination) {
            setPagination(json.pagination);
          }
        }
      } catch (e) {
        console.error("Error loading developers:", e);
      } finally {
        mounted && setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [pagination.page, searchQuery, sortBy, filters]);

  // Fetch services for each developer when developers are loaded
  useEffect(() => {
    if (developers.length > 0) {
      developers.forEach(developer => {
        if (!developerServices[developer.id]) {
          fetchDeveloperServices(developer.id);
        }
      });
    }
  }, [developers]);

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

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

  const getFreelancerLevel = (developer: Developer) => {
    // Logic to determine freelancer level based on developer data
    // You can customize this logic based on your business rules
    const rating = developer.ratingAvg || 0;
    const ratingCount = developer.ratingCount || 0;
    const views = developer.views || 0;
    
    if (rating >= 4.8 && ratingCount >= 50 && views >= 1000) {
      return { level: "Top expert", icon: "/images/client/exp.png" };
    } else if (rating >= 4.5 && ratingCount >= 20) {
      return { level: "Top starter", icon: "/images/client/starter.png" };
    } else if (rating >= 4.0) {
      return { level: "Professional", icon: "/images/client/pro.png" };
    } else {
      return { level: "Starter", icon: "/images/client/starter.png" };
    }
  };

  const fetchDeveloperServices = async (developerId: string) => {
    try {
      const res = await fetch(`/api/developers/${developerId}/services?limit=4`, { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json?.success && Array.isArray(json.data)) {
        setDeveloperServices(prev => ({
          ...prev,
          [developerId]: json.data
        }));
      }
    } catch (e) {
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
            name: developer.user.name,
            image: developer.user.image,
            location: developer.location,
          },
          skills: json.data.skills || [],
          categories: json.data.categories || [],
          leadsCount: json.data.leadsCount || 0,
        };
        
        console.log("Opening overlay with service data:", serviceData);
        setSelectedService(serviceData);
        setIsServiceOverlayOpen(true);
      } else {
        console.error("API error:", json);
      }
    } catch (e) {
      console.error("Error loading service details:", e);
    }
  };

  const handleDeveloperClick = (developer: Developer) => {
    router.push(`/developer/${developer.id}`);
  };

  if (loading && developers.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading developers...</p>
        </div>
      </div>
    );
  }

  if (!loading && developers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-2">No developers found</div>
        <p className="text-gray-400">
          {searchQuery ? `No results for "${searchQuery}"` : "Try adjusting your search criteria"}
        </p>
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
                Found <span className="font-semibold text-gray-900">{pagination.totalCount}</span> developers for "
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

      {/* Freelancers List - Row Layout */}
      <div className="space-y-6">
        {developers.map((developer) => (
          <div
            key={developer.id}
            className="bg-white rounded-2xl border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-lg group overflow-hidden cursor-pointer"
            onClick={() => handleDeveloperClick(developer)}
          >
            {/* Freelancer Header Row */}
            <div className="p-6">
                <div className="flex items-start justify-between">
                  {/* Left: Avatar, Name, Stats */}
                  <div className="flex items-start space-x-2 flex-1">
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-16 h-16">
                          <AvatarImage 
                            src={developer.user.image || ''} 
                            alt={developer.user.name}
                            className="object-cover w-full h-full"
                            onError={(e) => {
                              // Hide the image element if it fails to load
                              e.currentTarget.style.display = 'none';
                            }}
                            onLoad={(e) => {
                              // Ensure image is visible when it loads successfully
                              e.currentTarget.style.display = 'block';
                            }}
                          />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg">
                            {developer.user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'D'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          {/* Name */}
                          <div className="mb-2">
                            <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                              {developer.user.name}
                            </h3>
                          </div>
                          
                          {/* PRO Badge and Location on same line */}
                          <div className="flex items-center gap-2">
                            <Badge className="text-white text-xs font-medium px-2 py-0.5 rounded" style={{ backgroundColor: '#515151' }}>
                              PRO
                            </Badge>
                            <p className="text-sm" style={{ color: '#999999' }}>
                              {developer.location || "Location not specified"}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Stats Row below avatar */}
                      <div className="flex items-start mt-3">
                        <div className="flex items-start space-x-6 text-sm">
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
                              <Star className="w-4 h-4 fill-black text-black mr-1" />
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
                        <div className="ml-12 self-end">
                          {(() => {
                            const freelancerLevel = getFreelancerLevel(developer);
                            return (
                              <div className="flex items-center gap-2 px-4 py-1 rounded border" style={{ backgroundColor: '#F9FAFB' }}>
                                <img 
                                  src={freelancerLevel.icon} 
                                  alt={freelancerLevel.level} 
                                  className="w-4 h-4 object-contain"
                                />
                                <span className="text-sm font-medium text-gray-900">Top {freelancerLevel.level}</span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                {/* Right: Top Badge and Action Buttons */}
                <div className="flex flex-col items-end space-y-3">
                 
                
                  
                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      className="w-28 border-gray-300 text-gray-700 hover:bg-gray-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Follow
                    </Button>
                    <Button
                      className="w-28 bg-black text-white hover:bg-gray-800"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Get in Touch
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Services Grid - 4 Services (Images Only) */}
            {developerServices[developer.id] && developerServices[developer.id].length > 0 && (
              <div className="px-6 pb-6">
                <div className="pt-4">
                  <div className="grid grid-cols-4 gap-3">
                    {developerServices[developer.id].slice(0, 4).map((service) => (
                      <div key={service.id} className="group/service">
                        <div 
                          className="relative w-full h-45 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleServiceClick(service, developer);
                          }}
                        >
                          {service.coverUrl ? (
                            <img
                              src={service.coverUrl}
                              alt={service.title}
                              className="w-full h-full object-cover group-hover/service:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-semibold">
                              {service.title.split(' ').map(word => word[0]).join('').substring(0, 2)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* View All Services Button */}
                  {developerServices[developer.id].length > 4 && (
                    <div className="text-center mt-4">
                      <Button variant="link" className="p-0 h-auto text-blue-600 hover:text-blue-700">
                        View All {developerServices[developer.id].length} Services
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0 py-4">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{" "}
            <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.totalCount)}</span> of{" "}
            <span className="font-medium">{pagination.totalCount}</span> developers
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              Next
            </Button>
          </div>
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
          // Handle get in touch action
          console.log("Get in touch with service:", selectedService?.id);
        }}
        onFollow={() => {
          // Handle follow action
          console.log("Follow developer:", selectedService?.developer?.id);
        }}
        onServiceUpdate={(updatedService) => {
          // Update service data if needed
          setSelectedService(updatedService);
        }}
      />
    </>
  );
}

export default PeopleGrid;
