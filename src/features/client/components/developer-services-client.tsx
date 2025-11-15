"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/components/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/components/avatar";
import { Badge } from "@/ui/components/badge";
import { Card, CardContent } from "@/ui/components/card";
import { ArrowLeft, Briefcase, Calendar, DollarSign, Heart, Star } from "lucide-react";
import { cn } from "@/core/utils/utils";
import { GetInTouchButton } from "@/features/shared/components/get-in-touch-button";
import { useSession } from "next-auth/react";

interface Developer {
  id: string;
  name: string | null;
  image: string | null;
  level: string;
}

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
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
    location?: string | null;
  };
  skills: string[];
  categories: string[];
  leadsCount: number;
  galleryImages?: string[];
  showcaseImages?: string[];
}

interface DeveloperServicesClientProps {
  developer: Developer;
  services: Service[];
  selectedServiceId?: string;
}

export function DeveloperServicesClient({
  developer,
  services,
  selectedServiceId,
}: DeveloperServicesClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentService, setCurrentService] = useState<Service | null>(null);
  const [serviceLikes, setServiceLikes] = useState<Record<string, { liked: boolean; count: number }>>({});
  const FALLBACK_LISTING = "/services?tab=people";

  const handleBackNavigation = () => {
    if (typeof window === "undefined") {
      router.push(FALLBACK_LISTING);
      return;
    }

    // Prefer actual browser history when available
    if (window.history.length > 1) {
      router.back();
      return;
    }

    // If user landed here directly (e.g., from external link), send them to services listing
    router.push(FALLBACK_LISTING);
  };

  useEffect(() => {
    // Initialize likes state
    const likesState: Record<string, { liked: boolean; count: number }> = {};
    services.forEach(service => {
      likesState[service.id] = {
        liked: service.userLiked || false,
        count: service.likesCount || 0,
      };
    });
    setServiceLikes(likesState);

    // Set current service
    if (selectedServiceId) {
      const service = services.find(s => s.id === selectedServiceId);
      setCurrentService(service || services[0] || null);
    } else {
      setCurrentService(services[0] || null);
    }
  }, [services, selectedServiceId]);

  const handleServiceClick = (service: Service) => {
    setCurrentService(service);
    // Update URL without full page reload
    router.replace(`/developer/${developer.id}/services?serviceId=${service.id}`, { scroll: false });
  };

  const handleLike = async (serviceId: string) => {
    if (!session) {
      // Redirect to login
      router.push('/auth/signin');
      return;
    }

    const previousState = serviceLikes[serviceId];
    
    // Optimistic update
    setServiceLikes(prev => ({
      ...prev,
      [serviceId]: {
        liked: !previousState.liked,
        count: previousState.liked ? previousState.count - 1 : previousState.count + 1,
      }
    }));

    try {
      const response = await fetch(`/api/services/${serviceId}/like`, {
        method: 'POST',
      });

      if (!response.ok) {
        // Revert on error
        setServiceLikes(prev => ({
          ...prev,
          [serviceId]: previousState,
        }));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert on error
      setServiceLikes(prev => ({
        ...prev,
        [serviceId]: previousState,
      }));
    }
  };

  const formatPrice = (service: Service) => {
    if (service.priceType === 'FIXED') {
      if (service.priceMin && service.priceMax && service.priceMin !== service.priceMax) {
        return `$${service.priceMin.toLocaleString()} - $${service.priceMax.toLocaleString()}`;
      }
      return service.priceMin ? `$${service.priceMin.toLocaleString()}` : 'Contact for pricing';
    } else if (service.priceType === 'HOURLY') {
      return service.priceMin ? `$${service.priceMin}/hr` : 'Contact for pricing';
    }
    return 'Contact for pricing';
  };

  const otherServices = currentService 
    ? services.filter(s => s.id !== currentService.id)
    : services;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleBackNavigation();
                }}
                className="hover:bg-gray-100 cursor-pointer"
                type="button"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage 
                    src={developer.image || '/images/avata/default.jpeg'} 
                    className="object-cover"
                  />
                  <AvatarFallback>
                    {(developer.name || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">{developer.name}</h1>
                  <Badge 
                    className={cn(
                      "text-xs px-2 py-0.5 text-white font-semibold",
                      developer.level === 'EXPERT' 
                        ? 'bg-gradient-to-r from-gray-800 to-black' 
                        : developer.level === 'MID' 
                          ? 'bg-gradient-to-r from-gray-600 to-gray-700'
                          : 'bg-gradient-to-r from-gray-500 to-gray-600'
                    )}
                  >
                    {developer.level === 'EXPERT' ? 'TOP INDEPENDENT' : developer.level === 'MID' ? 'PRO' : 'STARTER'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {services.length} {services.length === 1 ? 'Service' : 'Services'}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Briefcase className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No services available</h3>
            <p className="text-gray-600 text-center">
              This developer hasn't created any services yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Main Service Detail - Left Side (2 columns) */}
            {currentService && (
              <div className="lg:col-span-2 space-y-6">
                {/* Service Card */}
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    {/* Cover Image */}
                    {currentService.coverUrl && (
                      <div className="relative h-64 sm:h-80 w-full bg-gray-100">
                        <img
                          src={currentService.coverUrl}
                          alt={currentService.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-6 sm:p-8">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex-1">
                          <h2 className="text-3xl font-bold text-gray-900 mb-3">
                            {currentService.title}
                          </h2>
                          <p className="text-gray-600 text-lg">
                            {currentService.shortDesc}
                          </p>
                        </div>
                        <button
                          onClick={() => handleLike(currentService.id)}
                          className="ml-4 p-3 rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <Heart
                            className={cn(
                              "h-6 w-6 transition-colors",
                              serviceLikes[currentService.id]?.liked
                                ? "fill-red-500 text-red-500"
                                : "text-gray-400"
                            )}
                          />
                        </button>
                      </div>

                      {/* Stats */}
                      <div className="flex flex-wrap gap-6 mb-6 pb-6 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">{currentService.ratingAvg.toFixed(1)}</span>
                          <span className="text-gray-600">({currentService.ratingCount} reviews)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Heart className="h-5 w-5 text-gray-400" />
                          <span className="text-gray-600">
                            {serviceLikes[currentService.id]?.count || 0} likes
                          </span>
                        </div>
                      </div>

                      {/* What's Included Section */}
                      <div className="mb-8">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">What's included</h3>
                        <div className="prose prose-gray max-w-none">
                          <p className="text-gray-700 leading-relaxed">
                            {currentService.shortDesc}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Sidebar - Right Side (1 column) */}
            <div className="lg:col-span-1">
              {/* Pricing Card */}
              {currentService && (
                <div className="sticky top-24">
                  <Card>
                  <CardContent className="p-6">
                    <div className="text-sm text-gray-600 uppercase tracking-wide mb-2">
                      STARTING AT
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-4">
                      {formatPrice(currentService)}
                    </div>

                    {/* Duration */}
                    {currentService.deliveryDays && (
                      <div className="flex items-center gap-2 mb-6 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {currentService.priceType === 'HOURLY' 
                            ? 'Price per hour' 
                            : `Delivery in ${currentService.deliveryDays} days`}
                        </span>
                      </div>
                    )}

                    <GetInTouchButton
                      developerId={developer.id}
                      developerName={developer.name || 'Developer'}
                      className="w-full mb-6"
                      variant="default"
                    />

                    {/* Skills and Tools Section */}
                    {currentService.skills && currentService.skills.length > 0 && (
                      <>
                        <div className="border-t border-gray-200 pt-6">
                          <h4 className="text-lg font-semibold text-gray-900 mb-3">Skills and tools</h4>
                          <div className="flex flex-wrap gap-2">
                            {currentService.skills.map((skill, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="text-sm px-3 py-1 bg-gray-100 text-gray-800 rounded-full"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        )}

        {/* More Services Section */}
        {otherServices.length > 0 && (
          <div className="mt-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">MORE SERVICES</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherServices.map((service) => (
                <Card
                  key={service.id}
                  className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                  onClick={() => handleServiceClick(service)}
                >
                  <CardContent className="p-0">
                    {/* Service Image */}
                    <div className="relative h-48 bg-gray-100">
                      {service.coverUrl ? (
                        <img
                          src={service.coverUrl}
                          alt={service.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Briefcase className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-lg">
                        {service.title}
                      </h4>

                      {/* Example Projects Badge */}
                      {service.leadsCount > 0 && (
                        <Badge variant="secondary" className="mb-3 text-xs">
                          <Briefcase className="h-3 w-3 mr-1" />
                          EXAMPLE PROJECTS
                        </Badge>
                      )}

                      {/* Pricing */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-600 uppercase tracking-wide mb-1">
                          STARTING AT
                        </div>
                        <div className="text-xl font-bold text-gray-900">
                          {formatPrice(service)}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {service.priceType === 'HOURLY' ? 'Price per hour' : 'fixed rate'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
