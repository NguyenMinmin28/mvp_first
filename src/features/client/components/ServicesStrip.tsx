"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import Image from "next/image";
import GetInTouchModal from "./GetInTouchModal";
import ServiceImageGallery from "./ServiceImageGallery";
import ServiceDetailOverlay, {
  ServiceDetailData,
} from "./ServiceDetailOverlay";
import { Star, MapPin, Clock, TrendingUp, Sparkles, Heart, Eye } from "lucide-react";

interface Service {
  id: string;
  slug: string;
  title: string;
  shortDesc: string;
  coverUrl?: string | null;
  images?: string[]; // Add multiple images support
  priceType: string;
  priceMin?: number | null;
  priceMax?: number | null;
  deliveryDays?: number | null;
  ratingAvg: number;
  ratingCount: number;
  views: number;
  likesCount: number;
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
}

export function ServicesStrip() {
  const { data: session } = useSession();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOverlayOpen, setIsDetailOverlayOpen] = useState(false);
  const [selectedServiceForDetail, setSelectedServiceForDetail] =
    useState<ServiceDetailData | null>(null);
  const [visibleServices, setVisibleServices] = useState<Set<string>>(new Set());
  const [hoveredService, setHoveredService] = useState<string | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/services?limit=4&sort=random", {
          cache: "no-store",
        });
        const json = await res.json();
        if (res.ok && json?.success && Array.isArray(json.data) && mounted) {
          // Add sample images for demonstration if services don't have images
          const servicesWithImages = json.data
            .slice(0, 4)
            .map((service: any) => ({
              ...service,
              images: service.images || [
                "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=300&fit=crop",
                "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop",
                "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop",
              ],
            }));
          setServices(servicesWithImages);
        }
      } catch (e) {
        // noop
      } finally {
        mounted && setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const serviceId = entry.target.getAttribute('data-service-id');
            if (serviceId) {
              setVisibleServices(prev => new Set([...prev, serviceId]));
            }
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    const serviceElements = document.querySelectorAll('[data-service-id]');
    serviceElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [services]);

  if (loading && services.length === 0) {
    return (
      <div ref={sectionRef} className="mt-24">
        <div className="flex items-center justify-between mb-6 animate-fade-in-up">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 hover:text-purple-600 transition-all duration-300 cursor-pointer title-glow title-underline">
              Services
            </h2>
          </div>
          <Button className="bg-black text-white hover:bg-black/90 transition-all duration-300 transform hover:scale-105" asChild>
            <a href="/services">Browse more</a>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Card key={idx} className="border border-gray-200 card-hover-lift">
              <CardContent className="p-4">
                <div className="h-24 w-24 rounded-lg skeleton mb-4" />
                <div className="h-4 w-2/3 skeleton mb-2 rounded" />
                <div className="h-3 w-1/2 skeleton rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!services.length) return null;

  const handleGetInTouch = (service: Service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handleServiceClick = (service: Service) => {
    // Convert Service to ServiceDetailData format
    const serviceDetailData: ServiceDetailData = {
      id: service.id,
      slug: service.slug,
      title: service.title,
      shortDesc: service.shortDesc,
      coverUrl: service.coverUrl,
      galleryImages: service.images, // Use galleryImages instead of images
      priceType: service.priceType,
      priceMin: service.priceMin,
      priceMax: service.priceMax,
      deliveryDays: service.deliveryDays,
      ratingAvg: service.ratingAvg,
      ratingCount: service.ratingCount,
      views: service.views,
      likesCount: service.likesCount,
      userLiked: false, // Default value
      developer: service.developer,
      skills: service.skills,
      categories: service.categories,
      leadsCount: service.leadsCount,
    };

    setSelectedServiceForDetail(serviceDetailData);
    setIsDetailOverlayOpen(true);
  };

  const handleDetailOverlayClose = () => {
    setIsDetailOverlayOpen(false);
    setSelectedServiceForDetail(null);
  };

  const handleDetailOverlayGetInTouch = () => {
    if (selectedServiceForDetail) {
      // Close detail overlay first
      setIsDetailOverlayOpen(false);
      // Open get in touch modal
      const service: Service = {
        id: selectedServiceForDetail.id,
        slug: selectedServiceForDetail.slug || "",
        title: selectedServiceForDetail.title,
        shortDesc: selectedServiceForDetail.shortDesc,
        coverUrl: selectedServiceForDetail.coverUrl,
        images: selectedServiceForDetail.galleryImages, // Use galleryImages
        priceType: selectedServiceForDetail.priceType,
        priceMin: selectedServiceForDetail.priceMin,
        priceMax: selectedServiceForDetail.priceMax,
        deliveryDays: selectedServiceForDetail.deliveryDays,
        ratingAvg: selectedServiceForDetail.ratingAvg,
        ratingCount: selectedServiceForDetail.ratingCount,
        views: selectedServiceForDetail.views,
        likesCount: selectedServiceForDetail.likesCount || 0,
        developer: selectedServiceForDetail.developer,
        skills: selectedServiceForDetail.skills,
        categories: selectedServiceForDetail.categories,
        leadsCount: selectedServiceForDetail.leadsCount,
      };
      setSelectedService(service);
      setIsModalOpen(true);
    }
  };

  return (
    <div ref={sectionRef} className="mt-24">
      <div className="flex items-center justify-between mb-6 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 hover:text-purple-600 transition-all duration-300 cursor-pointer title-glow title-underline">
            Services
          </h2>
        </div>
        <Button className="bg-black text-white hover:bg-black/90 transition-all duration-300 transform hover:scale-105" asChild>
          <a href="/services">Browse more</a>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {services.slice(0, 4).map((service, index) => {
          const isVisible = visibleServices.has(service.id);
          const isHovered = hoveredService === service.id;
          
          return (
            <Card
              key={service.id}
              data-service-id={service.id}
              className={`
                border border-gray-200 h-full cursor-pointer
                transition-all duration-500 transform
                ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
                hover:shadow-xl hover:scale-105 hover:-translate-y-2
                ${isHovered ? "ring-2 ring-blue-500 ring-opacity-50" : ""}
                group card-hover-lift
              `}
              style={{ transitionDelay: `${index * 100}ms` }}
              onClick={() => handleServiceClick(service)}
              onMouseEnter={() => setHoveredService(service.id)}
              onMouseLeave={() => setHoveredService(null)}
            >
            <CardContent className="p-5 h-full flex flex-col">
              {/* Service Image Gallery */}
              <ServiceImageGallery
                coverUrl={service.coverUrl}
                images={service.images}
                title={service.title}
                className="mb-4"
                animationType="slide"
                autoSlide={true}
                autoSlideInterval={3000}
                showOverlay={true}
              />

              {/* Freelancer Info */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 ring-2 ring-gray-200 group-hover:ring-blue-500 transition-all duration-300">
                  {service.developer.user.image ? (
                    <Image
                      src={service.developer.user.image}
                      alt={service.developer.user.name || "Freelancer"}
                      width={24}
                      height={24}
                      className="object-cover w-6 h-6 group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-gray-200" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-900 leading-tight group-hover:text-blue-600 transition-colors duration-300">
                    {service.developer.user.name || "Unknown"}
                  </div>
                  <div className="text-[10px] text-gray-500 flex items-center gap-1">
                    <MapPin className="h-2 w-2" />
                    {service.developer.location || ""}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between mb-4 text-sm">
                <div className="group-hover:scale-105 transition-transform duration-300">
                  <div className="font-semibold leading-tight flex items-center gap-1">
                    {service.ratingAvg.toFixed(1)}
                    <Star className="h-3 w-3 text-yellow-500" />
                  </div>
                  <div className="mt-1 flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const ratingValue = Math.floor(service.ratingAvg);
                      const filled = i < ratingValue;
                      return (
                        <span
                          key={i}
                          className={`text-[10px] transition-all duration-300 ${filled ? "text-yellow-500" : "text-gray-300"} mr-0.5`}
                          style={{ animationDelay: `${i * 100}ms` }}
                        >
                          ★
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className="group-hover:scale-105 transition-transform duration-300">
                  <div className="font-semibold flex items-center gap-1">
                    {service.leadsCount}
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  </div>
                  <div className="text-xs text-gray-500">Leads</div>
                </div>
                <div className="group-hover:scale-105 transition-transform duration-300">
                  <div className="font-semibold flex items-center gap-1">
                    {service.priceType === "FIXED"
                      ? `$${service.priceMin || 0}`
                      : `$${service.priceMin || 0}/h`}
                    <Sparkles className="h-3 w-3 text-blue-500" />
                  </div>
                  <div className="text-xs text-gray-500">Price</div>
                </div>
              </div>

              {/* Service Description */}
              <p className="text-xs text-gray-600 mb-4 line-clamp-3 group-hover:text-gray-800 transition-colors duration-300">
                {service.shortDesc}
              </p>

              {/* Hide Get in Touch button for developers */}
              {session?.user?.role !== "DEVELOPER" && (
                <Button
                  className="w-full mt-auto h-8 border border-[#838383] bg-transparent hover:bg-black hover:text-white text-gray-900 text-sm transition-all duration-300 transform hover:scale-105 group-hover:shadow-lg btn-press"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGetInTouch(service);
                  }}
                >
                  <span className="flex items-center gap-2">
                    Get in Touch
                    <Sparkles className="h-3 w-3" />
                  </span>
                </Button>
              )}
            </CardContent>
          </Card>
          );
        })}
      </div>

      {selectedService && (
        <GetInTouchModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedService(null);
          }}
          serviceId={selectedService.id}
          serviceTitle={selectedService.title}
          developerName={selectedService.developer.user.name || undefined}
        />
      )}

      {/* Service Detail Overlay */}
      <ServiceDetailOverlay
        isOpen={isDetailOverlayOpen}
        service={selectedServiceForDetail}
        onClose={handleDetailOverlayClose}
        onGetInTouch={handleDetailOverlayGetInTouch}
        onFollow={() => {
          // Handle follow action
          console.log("Follow clicked");
        }}
        onPrev={() => {
          // Handle previous service
          console.log("Previous service");
        }}
        onNext={() => {
          // Handle next service
          console.log("Next service");
        }}
        onServiceUpdate={(updatedService) => {
          // Update service data if needed
          setSelectedServiceForDetail(updatedService);
        }}
      />
    </div>
  );
}

export default ServicesStrip;
