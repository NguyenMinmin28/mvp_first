"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import Image from "next/image";
import GetInTouchModal from "./GetInTouchModal";
import ServiceImageGallery from "./ServiceImageGallery";
import ServiceDetailOverlay, {
  ServiceDetailData,
} from "./ServiceDetailOverlay";

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
    photoUrl?: string | null;
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

  if (loading && services.length === 0) {
    return (
      <div className="mt-10">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6">
          Services
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Card key={idx} className="border border-gray-200">
              <CardContent className="p-4">
                <div className="h-24 w-24 rounded-full bg-gray-200 animate-pulse mb-4" />
                <div className="h-4 w-2/3 bg-gray-200 animate-pulse mb-2" />
                <div className="h-3 w-1/2 bg-gray-200 animate-pulse" />
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
    <div className="mt-24">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
          Services
        </h2>
        <Button className="bg-black text-white hover:bg-black/90" asChild>
          <a href="/services">Browse more</a>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {services.slice(0, 4).map((service) => (
          <Card
            key={service.id}
            className="hover:shadow-md transition-shadow border border-gray-200 h-full cursor-pointer"
            onClick={() => handleServiceClick(service)}
          >
            <CardContent className="p-5 h-full flex flex-col">
              {/* Service Image Gallery */}
              <ServiceImageGallery
                coverUrl={service.coverUrl}
                images={service.images}
                title={service.title}
                className="mb-4"
                animationType="slide"
              />

              {/* Freelancer Info */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100">
                  {service.developer.photoUrl || service.developer.user.image ? (
                    <Image
                      src={service.developer.photoUrl || service.developer.user.image || ''}
                      alt={service.developer.user.name || "Freelancer"}
                      width={24}
                      height={24}
                      className="object-cover w-6 h-6"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-gray-200" />
                  )}
                </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-gray-900 leading-tight">
                      {service.developer.user.name || "Unknown"}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      {service.developer.location || ""}
                    </div>
                  </div>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between mb-4 text-sm">
                <div>
                  <div className="font-semibold leading-tight">
                    {service.ratingAvg.toFixed(1)}
                  </div>
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
                      : `$${service.priceMin || 0}/h`}
                  </div>
                  <div className="text-xs text-gray-500">Price</div>
                </div>
              </div>

                {/* Service Description */}
                <p className="service-description text-xs text-gray-600 mb-4 line-clamp-3">
                  {service.shortDesc}
                </p>

              {/* Hide Get in Touch button for developers */}
              {session?.user?.role !== "DEVELOPER" && (
                <Button
                  className="w-full mt-auto h-8 border border-[#838383] bg-transparent hover:bg-black hover:text-white text-gray-900 text-sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGetInTouch(service);
                  }}
                >
                  Get in Touch
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
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
