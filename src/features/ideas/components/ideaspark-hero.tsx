"use client";

import { ImageWithShimmer } from "@/ui/components/image-with-shimmer";
import { Button } from "@/ui/components/button";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface IdeasStats {
  totalIdeas: number;
  approvedIdeas: number;
  pendingIdeas: number;
  totalLikes: number;
  totalComments: number;
  totalBookmarks: number;
  totalConnects: number;
  recentIdeas: number;
  engagementRate: number;
  topCategories: Array<{
    category: string;
    count: number;
  }>;
}

export function IdeaSparkHero() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<IdeasStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/ideas/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching ideas stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostIdea = () => {
    if (!session?.user) {
      router.push('/auth/signin?callbackUrl=/ideas/submit');
      return;
    }
    window.location.href = '/ideas/submit';
  };

  return (
    <section className="relative bg-[#FFF8EB] overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          {/* Left Content */}
          <div className="space-y-8 lg:space-y-10 order-2 lg:order-1">
            <div className="space-y-6 lg:space-y-8">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight">
                IdeaSpark: Where Ideas Find Backers
              </h1>
              
              <p className="text-lg sm:text-xl lg:text-2xl text-gray-700 leading-relaxed max-w-2xl">
                Post your idea, connect with people who believe in it, and take the first step toward funding. The right spark can light up your future.
              </p>
            </div>

            <div className="pt-6 lg:pt-8">
              <Button 
                size="lg" 
                className="bg-black hover:bg-gray-800 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={handlePostIdea}
              >
                Post idea
              </Button>
            </div>
          </div>

          {/* Right Side - Image with Stats Card */}
          <div className="relative order-1 lg:order-2">
            {/* Pink curved background */}
            <div className="absolute top-0 right-0 w-full h-full">
              <div className="relative w-full h-full">
                <div 
                  className="absolute top-0 right-0 w-[120%] h-[120%] bg-gradient-to-br from-pink-400 to-pink-500 rounded-full transform translate-x-1/4 -translate-y-1/4"
                  style={{
                    clipPath: "ellipse(70% 80% at 70% 30%)"
                  }}
                ></div>
              </div>
            </div>

            {/* Woman with IDEA bubble */}
            <div className="relative z-10 flex justify-center lg:justify-end">
              <div className="relative max-w-md lg:max-w-lg">
                <ImageWithShimmer
                  src="/images/spark/ideaholing.jpg"
                  alt="Woman holding IDEA bubble with thumbs up"
                  width={400}
                  height={500}
                  className="object-cover w-full h-auto"
                  containerClassName="w-full"
                  shimmerSize="hero"
                />
              </div>
            </div>

            {/* Earnings Stats Card */}
            <div className="absolute bottom-4 left-4 lg:bottom-8 lg:left-8 z-20">
              <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-xl border border-gray-100 min-w-[280px]">
                <div className="space-y-5">
                  <h3 className="text-lg font-bold text-gray-900">Earnings Received</h3>
                  
                  <div className="text-3xl font-bold text-gray-900">
                    {loading ? "Loading..." : stats ? `$${stats.totalConnects * 750}` : "$45000"}
                  </div>

                  {/* Progress bars and chart */}
                  <div className="flex items-center gap-6">
                    {/* Circular progress */}
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-8 border-gray-200 relative overflow-hidden">
                        {/* Purple segment (73%) */}
                        <div 
                          className="absolute inset-0 rounded-full border-8 border-purple-500"
                          style={{
                            clipPath: "polygon(50% 50%, 50% 0%, 100% 0%, 100% 73%, 50% 50%)"
                          }}
                        ></div>
                        {/* Center percentage */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold text-gray-700">73%</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress bars */}
                    <div className="flex-1 space-y-3">
                      {/* Purple bar */}
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: "85%" }}></div>
                      </div>
                      {/* Orange bar */}
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-400 rounded-full" style={{ width: "60%" }}></div>
                      </div>
                      {/* Blue bar */}
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: "40%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}