"use client";

import { useState, useEffect, useRef, useCallback, memo, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/components/button";
import { Badge } from "@/ui/components/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/components/avatar";
import { Heart, MessageCircle, Star, MapPin, Clock, DollarSign, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import type { ServiceDetailData } from "@/features/client/components/ServiceDetailOverlay";
import { toast } from "sonner";
import { GetInTouchButton } from "@/features/shared/components/get-in-touch-button";
import { GetInTouchModal } from "@/features/client/components/GetInTouchModal";
import { DeveloperProfileSlideBar } from "./developer-profile-slide-bar";
import { useInfiniteScroll, useScrollInfiniteLoad } from "@/core/hooks/useInfiniteScroll";

const ServiceDetailOverlay = dynamic(
  () => import("@/features/client/components/ServiceDetailOverlay"),
  { ssr: false, loading: () => <div className="p-4 text-sm text-gray-600">Loading…</div> }
);

// Cache for developer services to avoid repeated API calls
const developerServicesCache = new Map<string, { data: any[], timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

function DevelopersSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div key={idx} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
          <div className="flex items-center space-x-4 mb-4">
            <div className="h-12 w-12 rounded-full bg-gray-200" />
            <div className="flex-1">
              <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-1/2 bg-gray-200 rounded" />
            </div>
          </div>
          <div className="space-y-2 mb-4">
            <div className="h-3 w-full bg-gray-200 rounded" />
            <div className="h-3 w-2/3 bg-gray-200 rounded" />
          </div>
          <div className="flex space-x-2 mb-4">
            <div className="h-6 w-16 bg-gray-200 rounded" />
            <div className="h-6 w-20 bg-gray-200 rounded" />
          </div>
          <div className="h-10 w-full bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

interface Developer {
  id: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
  photoUrl?: string;
  bio?: string;
  experienceYears?: number;
  level: "EXPERT" | "MID" | "FRESHER";
  location?: string;
  hourlyRateUsd?: number;
  ratingAvg?: number;
  ratingCount?: number;
  currentStatus: string;
  whatsappVerified: boolean;
  usualResponseTimeMs?: number;
}

interface DeveloperService {
  id: string;
  title: string;
  shortDesc: string;
  coverUrl?: string;
  priceType: string;
  priceMin?: number;
  priceMax?: number;
  ratingAvg?: number;
  ratingCount?: number;
  views?: number;
  likesCount?: number;
}

interface PeopleGridProps {
  searchQuery?: string;
  sortBy?: string;
  filters?: string[];
  overrideDevelopers?: Developer[];
  autoRefreshEnabled?: boolean;
  onAutoRefreshToggle?: (enabled: boolean) => void;
  freelancerResponseStatuses?: Record<string, string>;
  freelancerDeadlines?: Record<string, Date>;
  onGenerateNewBatch?: () => void;
  locked?: boolean;
  projectId?: string;
  hideHeaderControls?: boolean;
}

export const PeopleGridOptimized = memo(function PeopleGridOptimized({ 
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
  
  const { data: session } = useSession();
  const [developerServices, setDeveloperServices] = useState<Record<string, DeveloperService[]>>({});
  const [selectedService, setSelectedService] = useState<ServiceDetailData | null>(null);
  const [isServiceOverlayOpen, setIsServiceOverlayOpen] = useState(false);
  const [isOverlayLoading, setIsOverlayLoading] = useState(false);
  const serviceDetailCacheRef = useRef<Record<string, ServiceDetailData>>({});
  const [selectedFreelancer, setSelectedFreelancer] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedServiceForContact, setSelectedServiceForContact] = useState<{ id: string; title: string } | null>(null);
  const [selectedDeveloper, setSelectedDeveloper] = useState<{id: string, name?: string} | null>(null);
  const isOverride = Array.isArray(overrideDevelopers);
  
  // Internal state với fallback từ props
  const [internalAutoRefresh, setInternalAutoRefresh] = useState(externalAutoRefresh ?? true);
  
  // Reset state when projectId changes to avoid showing stale data
  const prevProjectIdRef = useRef(projectId);
  useEffect(() => {
    if (projectId !== prevProjectIdRef.current) {
     
      prevProjectIdRef.current = projectId;
      // Clear cache when project changes
      developerServicesCache.clear();
    }
  }, [projectId]);

  // Sync với external state khi props thay đổi
  const prevExternalRef = useRef(externalAutoRefresh);
  useEffect(() => {
    if (externalAutoRefresh !== undefined && externalAutoRefresh !== prevExternalRef.current) {
     
      setInternalAutoRefresh(externalAutoRefresh);
      prevExternalRef.current = externalAutoRefresh;
    }
  }, [externalAutoRefresh]);
  
  // Current state - sử dụng internal state để có immediate feedback
  const autoRefreshEnabled = internalAutoRefresh;

  const formatTimeRemaining = (deadline: Date) => {
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    
    return `${seconds}s`;
  };

  const getFreelancerLevel = (developer: Developer) => {
    const level = developer.level;
    
    switch (level) {
      case "EXPERT":
        return { level: "Expert", icon: "/images/client/exp.png" };
      case "MID":
        return { level: "Professional", icon: "/images/client/pro.png" };
      case "FRESHER":
        return { level: "Starter", icon: "/images/client/starter.png" };
      default:
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

  // Optimized fetch with caching
  const fetchDeveloperServices = useCallback(async (developerId: string, signal?: AbortSignal) => {
    // Check cache first
    const cached = developerServicesCache.get(developerId);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
     
      setDeveloperServices(prev => ({
        ...prev,
        [developerId]: cached.data
      }));
      return cached.data as DeveloperService[];
    }

    try {
      console.time(`fetch-services-${developerId}`);
      const res = await fetch(`/api/developers/${developerId}/services?limit=4`, { 
        cache: "no-store", 
        signal 
      });
      const json = await res.json();
      
      if (res.ok && json?.success && Array.isArray(json.data)) {
        const services = json.data as DeveloperService[];
        
        // Cache the result
        developerServicesCache.set(developerId, {
          data: services,
          timestamp: Date.now()
        });
        
        setDeveloperServices(prev => ({
          ...prev,
          [developerId]: services
        }));
        
        console.timeEnd(`fetch-services-${developerId}`);
       
        return services;
      }
    } catch (e) {
      if ((e as any)?.name === 'AbortError') return [] as DeveloperService[];
      console.error("Error loading developer services:", e);
    }
    return [] as DeveloperService[];
  }, []);

  // Batch fetch services with optimized timing
  const batchFetchServices = useCallback(async (developers: Developer[]) => {
    const batchSize = 3; // Reduced batch size for better performance
    const delay = 200; // Reduced delay between batches
    
    for (let i = 0; i < developers.length; i += batchSize) {
      const batch = developers.slice(i, i + batchSize);
      
      // Fetch services for this batch
      await Promise.all(
        batch.map(developer => 
          fetchDeveloperServices(developer.id)
        )
      );
      
      // Add delay between batches to avoid overwhelming the server
      if (i + batchSize < developers.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }, [fetchDeveloperServices]);

  // Optimized service fetching with batching
  useEffect(() => {
    if (!isOverride || !overrideDevelopers) return;

    const developers = overrideDevelopers.filter(dev => !developerServices[dev.id]);
    if (developers.length === 0) return;

   
    batchFetchServices(developers);
  }, [isOverride, overrideDevelopers, developerServices, batchFetchServices]);

  const prefetchServiceDetail = async (serviceId: string, developer: Developer) => {
    if (serviceDetailCacheRef.current[serviceId]) return;
    
    try {
      setIsOverlayLoading(true);
      const res = await fetch(`/api/services/${serviceId}`, { cache: "no-store" });
      const json = await res.json();
      
      if (res.ok && json?.success) {
        serviceDetailCacheRef.current[serviceId] = json.data;
      }
    } catch (error) {
      console.error("Error prefetching service detail:", error);
    } finally {
      setIsOverlayLoading(false);
    }
  };

  const handleServiceClick = async (service: DeveloperService, developer: Developer) => {
    const serviceId = service.id;
    
    // Check cache first
    if (serviceDetailCacheRef.current[serviceId]) {
      setSelectedService(serviceDetailCacheRef.current[serviceId]);
      setIsServiceOverlayOpen(true);
      return;
    }
    
    // Prefetch if not in cache
    await prefetchServiceDetail(serviceId, developer);
    
    if (serviceDetailCacheRef.current[serviceId]) {
      setSelectedService(serviceDetailCacheRef.current[serviceId]);
      setIsServiceOverlayOpen(true);
    }
  };

  const handleGetInTouch = async (developer: Developer) => {
    setSelectedFreelancer(developer);
    // Pick first available public service like Services (People tab)
    let services = developerServices[developer.id];
    if (!services) {
      services = await fetchDeveloperServices(developer.id);
    }
    const firstService = (services || [])[0];
    if (!firstService) {
      toast.error("This developer has no public services yet.");
      return;
    }
    setSelectedServiceForContact({ id: firstService.id, title: firstService.title });
    setIsModalOpen(true);
  };

  // Memoized filtered developers
  const filteredDevList = useMemo(() => {
    if (!isOverride || !overrideDevelopers) return [];
    
    let filtered = overrideDevelopers;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(dev => 
        dev.user.name.toLowerCase().includes(query) ||
        dev.bio?.toLowerCase().includes(query) ||
        dev.location?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [isOverride, overrideDevelopers, searchQuery]);

  // Render developer card
  const renderDeveloperCard = (developer: Developer) => {
    const services = developerServices[developer.id] || [];
    const levelInfo = getFreelancerLevel(developer);
    const responseStatus = freelancerResponseStatuses?.[developer.id];
    const deadline = freelancerDeadlines?.[developer.id];
    
    return (
      <div key={developer.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 ease-out hover:-translate-y-1 hover:border-blue-300 group overflow-hidden will-change-transform">
        <div className="flex items-center space-x-4 mb-4">
          <Avatar 
            className="h-12 w-12 transition-transform duration-200 ease-out will-change-transform group-hover:scale-105 cursor-pointer"
            onClick={() => setSelectedDeveloper({
              id: developer.id,
              name: developer.user.name
            })}
          >
            <AvatarImage 
              src={developer.photoUrl || developer.user.image || '/images/avata/default.jpeg'} 
              className="transition-transform duration-200 ease-out will-change-transform group-hover:scale-105"
              onError={(e) => {
                // Set to default image on error
                (e.target as HTMLImageElement).src = '/images/avata/default.jpeg';
              }}
            />
            <AvatarFallback className="bg-gray-200 w-full h-full flex items-center justify-center">
              <img 
                src="/images/avata/default.jpeg" 
                alt="Default Avatar"
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  // If default image also fails, show a simple placeholder
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 
              className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={() => setSelectedDeveloper({
                id: developer.id,
                name: developer.user.name
              })}
            >
              {developer.user.name}
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <MapPin className="h-4 w-4" />
              <span>{developer.location || "Location not specified"}</span>
            </div>
          </div>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {developer.bio || "No bio available"}
        </p>
        
        <div className="flex items-center space-x-2 mb-4">
          <Badge variant="secondary" className="flex items-center space-x-1">
            <img src={levelInfo.icon} alt={levelInfo.level} className="h-4 w-4" />
            <span>{levelInfo.level}</span>
          </Badge>
          {developer.experienceYears && (
            <Badge variant="outline">
              {developer.experienceYears}+ years
            </Badge>
          )}
        </div>
        
        {services.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Services</h4>
            <div className="space-y-2">
              {services.slice(0, 2).map((service) => (
                <div
                  key={service.id}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors duration-200 ease-out hover:border hover:border-blue-200"
                  onClick={() => handleServiceClick(service, developer)}
                >
                  {service.coverUrl && (
                    <img
                      src={service.coverUrl}
                      alt={service.title}
                      className="h-10 w-10 rounded object-cover transition-transform duration-200 ease-out will-change-transform hover:scale-105"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {service.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {service.shortDesc}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {service.priceType === "FIXED" && service.priceMin && (
                      <span>${service.priceMin}</span>
                    )}
                    {service.priceType === "HOURLY" && (
                      <span>${developer.hourlyRateUsd}/hr</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {responseStatus === "pending" && deadline && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2 text-sm text-yellow-800">
              <Clock className="h-4 w-4" />
              <span>Response time: {formatTimeRemaining(deadline)}</span>
            </div>
          </div>
        )}
        
        <div className="flex space-x-2">
          <Button
            onClick={() => handleGetInTouch(developer)}
            className="flex-1 px-6"
            disabled={locked}
          >
            Get in Touch
          </Button>
          {services.length > 0 && (
            <Button
              variant="outline"
              onClick={() => handleServiceClick(services[0], developer)}
              disabled={locked}
            >
              View Services
            </Button>
          )}
        </div>
      </div>
    );
  };

  if (!isOverride) {
    return <DevelopersSkeleton />;
  }

  return (
    <div className="space-y-6">
      {!hideHeaderControls && (
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Available Freelancers ({filteredDevList.length})
          </h2>
          <div className="flex items-center space-x-4">
            {onGenerateNewBatch && (
              <Button
                onClick={onGenerateNewBatch}
                variant="outline"
                disabled={locked}
              >
                Generate New Batch
              </Button>
            )}
          </div>
        </div>
      )}
      
      {filteredDevList.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No freelancers found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDevList.map(renderDeveloperCard)}
        </div>
      )}
      
      <ServiceDetailOverlay
        isOpen={isServiceOverlayOpen}
        service={selectedService}
        onClose={() => setIsServiceOverlayOpen(false)}
        onGetInTouch={() => {}}
        onPrev={() => {}}
        onNext={() => {}}
        onFollow={() => {}}
        onServiceUpdate={() => {}}
        projectId={projectId}
      />
      
      <GetInTouchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        serviceId={selectedServiceForContact?.id || ""}
        serviceTitle={selectedServiceForContact?.title || ""}
        developerName={selectedFreelancer?.user?.name || ""}
      />

      {/* Developer Profile Slide Bar */}
      {selectedDeveloper && (
        <DeveloperProfileSlideBar
          isOpen={!!selectedDeveloper}
          onClose={() => setSelectedDeveloper(null)}
          developerId={selectedDeveloper.id}
          developerName={selectedDeveloper.name}
        />
      )}
    </div>
  );
});
