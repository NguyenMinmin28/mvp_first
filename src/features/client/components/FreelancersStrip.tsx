"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import Image from "next/image";
import GetInTouchModal from "./GetInTouchModal";

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
  likesCount: number;
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

export function FreelancersStrip() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/services?limit=5&sort=popular", { cache: "no-store" });
        const json = await res.json();
        if (res.ok && json?.success && Array.isArray(json.data) && mounted) {
          setServices(json.data);
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
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6">Services</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, idx) => (
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

  return (
    <div className="mt-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Services</h2>
        <Button className="bg-black text-white hover:bg-black/90" asChild>
          <a href="/services">Browse more</a>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {services.map((service) => (
          <Card key={service.id} className="hover:shadow-md transition-shadow border border-gray-200 h-full">
            <CardContent className="p-5 h-full flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                    {service.coverUrl ? (
                      <Image src={service.coverUrl} alt={service.title} width={48} height={48} className="object-cover w-12 h-12" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 leading-tight">{service.title}</div>
                    <div className="text-xs text-gray-500">{service.developer.name || "Unknown"}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 text-sm">
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

              <p className="text-xs text-gray-600 mt-4 line-clamp-3">
                {service.shortDesc}
              </p>

              <Button 
                className="w-full mt-auto border border-[#838383] bg-transparent hover:bg-gray-50 text-gray-900" 
                variant="outline"
                onClick={() => handleGetInTouch(service)}
              >
                Get in Touch
              </Button>
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
          developerName={selectedService.developer.name || undefined}
        />
      )}
    </div>
  );
}

export default FreelancersStrip;


