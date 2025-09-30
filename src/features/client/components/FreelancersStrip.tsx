"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { GetInTouchButton } from "@/features/shared/components/get-in-touch-button";

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

  // Contact handled by GetInTouchButton

  const handleCardClick = (freelancer: Freelancer) => {
    router.push(`/developer/${freelancer.id}`);
  };

  if (loading && freelancers.length === 0) {
    return (
      <div className="mt-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Freelancers</h2>
          <Button className="bg-black text-white hover:bg-black/90" asChild>
            <a href="/services?tab=people">Browse more</a>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Card key={idx} className="border border-gray-200">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse" />
                  <div>
                    <div className="h-4 w-24 bg-gray-200 animate-pulse mb-2" />
                    <div className="h-3 w-16 bg-gray-200 animate-pulse" />
                  </div>
                </div>
                <div className="h-4 w-full bg-gray-200 animate-pulse mb-2" />
                <div className="h-3 w-3/4 bg-gray-200 animate-pulse" />
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
    <div className="mt-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Freelancers</h2>
        <Button className="bg-black text-white hover:bg-black/90" asChild>
          <a href="/services?tab=people">Browse more</a>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {freelancers.map((freelancer) => (
          <Card 
            key={freelancer.id} 
            className="hover:shadow-md transition-shadow border border-gray-200 h-full cursor-pointer"
            onClick={() => handleCardClick(freelancer)}
          >
            <CardContent className="p-5 h-full flex flex-col">
                {/* Freelancer Info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative inline-block w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                    {freelancer.image ? (
                      <Image 
                        src={freelancer.image} 
                        alt={freelancer.name || "Freelancer"} 
                        width={48} 
                        height={48} 
                        className="object-cover w-12 h-12" 
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200" />
                    )}
                    <span
                      className={`absolute right-0 top-0 inline-block w-4 h-4 rounded-full border-2 border-white transform translate-x-1/2 -translate-y-1/2 ${
                        freelancer.currentStatus === 'available' ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                      aria-label={freelancer.currentStatus === 'available' ? 'Available' : 'Not Available'}
                      title={freelancer.currentStatus === 'available' ? 'Available' : 'Not Available'}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 leading-tight">
                      {freelancer.name || "Unknown"}
                    </div>
                    <div className="text-xs text-gray-500 font-semibold">
                      {freelancer.location || ""}
                    </div>
                  </div>
                </div>


                {/* Stats */}
                <div className="flex items-center justify-between mb-4 text-sm">
                  <div>
                    <div className="font-semibold leading-tight">{freelancer.reviews.averageRating.toFixed(1)}</div>
                    <div className="mt-1 flex items-center">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const ratingValue = Math.floor(freelancer.reviews.averageRating);
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
                    <div className="font-semibold">{freelancer.jobsCount}</div>
                    <div className="text-xs text-gray-500">Jobs</div>
                  </div>
                  <div>
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
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                    {freelancer.skills.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
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
                    className="w-full mt-auto h-8 border border-[#838383] bg-transparent hover:bg-black hover:text-white text-gray-900 text-sm"
                    variant="outline"
                    size="default"
                  />
                </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Contact modals handled internally by GetInTouchButton */}
    </div>
  );
}

export default FreelancersStrip;


