"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { GetInTouchButton } from "@/features/shared/components/get-in-touch-button";
import { Star, MapPin, Clock, TrendingUp, Sparkles } from "lucide-react";

interface Freelancer {
  id: string;
  userId: string;
  name?: string | null;
  image?: string | null;
  location?: string | null;
  hourlyRateUsd?: number | null;
  level: string;
  experienceYears?: number | null;
  currentStatus: string;
  usualResponseTimeMs?: number | null;
  jobsCount: number;
  reviews: {
    averageRating: number;
    totalReviews: number;
  };
  skills: string[];
}

export function FreelancersStrip() {
  const router = useRouter();
  const { data: session } = useSession();
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(false);
  const [visibleFreelancers, setVisibleFreelancers] = useState<Set<string>>(new Set());
  const [hoveredFreelancer, setHoveredFreelancer] = useState<string | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  // Using shared GetInTouchButton flow; no local modal state needed

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/developer/top?limit=4", { cache: "no-store" });
        const json = await res.json();
        if (res.ok && json?.success && Array.isArray(json.data) && mounted) {
          setFreelancers(json.data);
        }
      } catch (e) {
        console.error("Error loading freelancers:", e);
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
            const freelancerId = entry.target.getAttribute('data-freelancer-id');
            if (freelancerId) {
              setVisibleFreelancers(prev => new Set([...prev, freelancerId]));
            }
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    const freelancerElements = document.querySelectorAll('[data-freelancer-id]');
    freelancerElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [freelancers]);

  // Contact handled by GetInTouchButton

  const handleCardClick = (freelancer: Freelancer) => {
    router.push(`/developer/${freelancer.id}`);
  };

  if (loading && freelancers.length === 0) {
    return (
      <div ref={sectionRef} className="mt-16">
        <div className="flex items-center justify-between mb-6 animate-fade-in-up">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 hover:text-green-600 transition-all duration-300 cursor-pointer title-glow title-underline">
              Freelancers
            </h2>
          </div>
          <Button className="bg-black text-white hover:bg-black/90 transition-all duration-300 transform hover:scale-105" asChild>
            <a href="/services?tab=people">Browse more</a>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Card key={idx} className="border border-gray-200 card-hover-lift">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full skeleton" />
                  <div className="flex-1">
                    <div className="h-4 w-24 skeleton mb-2 rounded" />
                    <div className="h-3 w-16 skeleton rounded" />
                  </div>
                </div>
                <div className="h-4 w-full skeleton mb-2 rounded" />
                <div className="h-3 w-3/4 skeleton rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!freelancers.length && !loading) {
    return (
      <div className="mt-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Freelancers</h2>
          <Button className="bg-black text-white hover:bg-black/90" asChild>
            <a href="/services?tab=people">Browse more</a>
          </Button>
        </div>
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-2">No freelancers available</div>
        </div>
      </div>
    );
  }

  return (
    <div ref={sectionRef} className="mt-16">
      <div className="flex items-center justify-between mb-6 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 hover:text-green-600 transition-all duration-300 cursor-pointer title-glow title-underline">
            Freelancers
          </h2>
        </div>
        <Button className="bg-black text-white hover:bg-black/90 transition-all duration-300 transform hover:scale-105" asChild>
          <a href="/services?tab=people">Browse more</a>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {freelancers.map((freelancer, index) => {
          const isVisible = visibleFreelancers.has(freelancer.id);
          const isHovered = hoveredFreelancer === freelancer.id;
          
          return (
            <Card 
              key={freelancer.id} 
              data-freelancer-id={freelancer.id}
              className={`
                border border-gray-200 h-full cursor-pointer
                transition-all duration-500 transform
                ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
                hover:shadow-xl hover:scale-105 hover:-translate-y-2
                ${isHovered ? "ring-2 ring-blue-500 ring-opacity-50" : ""}
                group card-hover-lift
              `}
              style={{ transitionDelay: `${index * 100}ms` }}
              onClick={() => handleCardClick(freelancer)}
              onMouseEnter={() => setHoveredFreelancer(freelancer.id)}
              onMouseLeave={() => setHoveredFreelancer(null)}
            >
            <CardContent className="p-5 h-full flex flex-col">
                {/* Freelancer Info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative group-hover:scale-110 transition-transform duration-300">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 ring-2 ring-gray-200 group-hover:ring-blue-500 transition-all duration-300">
                      {freelancer.image ? (
                        <Image 
                          src={freelancer.image} 
                          alt={freelancer.name || "Freelancer"} 
                          width={48} 
                          height={48} 
                          className="object-cover w-12 h-12 group-hover:scale-110 transition-transform duration-300" 
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200" />
                      )}
                    </div>
                    <span
                      className={`absolute -bottom-1 -right-1 inline-block w-4 h-4 rounded-full border-2 border-white transition-all duration-300 ${
                        freelancer.currentStatus === 'available' 
                          ? 'bg-green-500 status-pulse' 
                          : 'bg-gray-400'
                      }`}
                      style={{ zIndex: 9999 }}
                      aria-label={freelancer.currentStatus === 'available' ? 'Available' : 'Not Available'}
                      title={freelancer.currentStatus === 'available' ? 'Available' : 'Not Available'}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors duration-300">
                      {freelancer.name || "Unknown"}
                    </div>
                    <div className="text-xs text-gray-500 font-semibold flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {freelancer.location || ""}
                    </div>
                  </div>
                </div>


                {/* Stats */}
                <div className="flex items-center justify-between mb-4 text-sm">
                  <div className="group-hover:scale-105 transition-transform duration-300">
                    <div className="font-semibold leading-tight flex items-center gap-1">
                      {freelancer.reviews.averageRating.toFixed(1)}
                      <Star className="h-3 w-3 text-yellow-500" />
                    </div>
                    <div className="mt-1 flex items-center">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const ratingValue = Math.floor(freelancer.reviews.averageRating);
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
                      {freelancer.jobsCount}
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    </div>
                    <div className="text-xs text-gray-500">Jobs</div>
                  </div>
                  <div className="group-hover:scale-105 transition-transform duration-300">
                    <div className="font-semibold">
                      {freelancer.hourlyRateUsd ? `$${freelancer.hourlyRateUsd}/h` : "Contact"}
                    </div>
                    <div className="text-xs text-gray-500">Rate</div>
                  </div>
                </div>

                {/* Skills */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {freelancer.skills.slice(0, 3).map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full transition-all duration-300 hover:bg-blue-100 hover:text-blue-700 hover:scale-105 cursor-default"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {skill}
                      </span>
                    ))}
                    {freelancer.skills.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full transition-all duration-300 hover:bg-blue-100 hover:text-blue-700 hover:scale-105 cursor-default">
                        +{freelancer.skills.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Get in Touch Button */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                  }}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <GetInTouchButton
                    developerId={freelancer.id}
                    developerName={freelancer.name || undefined}
                    className="w-full mt-auto h-8 border border-[#838383] bg-transparent hover:bg-black hover:text-white text-gray-900 text-sm transition-all duration-300 transform hover:scale-105 group-hover:shadow-lg btn-press"
                    variant="outline"
                    size="default"
                  />
                </div>
            </CardContent>
          </Card>
          );
        })}
      </div>

      {/* Contact modals handled internally by GetInTouchButton */}
    </div>
  );
}

export default FreelancersStrip;


