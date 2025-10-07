"use client";

import Image from "next/image";
import { Button } from "@/ui/components/button";
import { Zap, TrendingUp, Users, Lightbulb, LogIn } from "lucide-react";
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
    <section className="relative bg-white flex items-start pt-4 sm:pt-6 lg:pt-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-7">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-24 items-center">
          {/* Left Content */}
          <div className="space-y-4 sm:space-y-6 order-2 lg:order-1">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-3">
              </div>
              
              <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 leading-tight">
                IdeaSpark: Where Ideas Find Backers
              </h1>
              
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed max-w-lg">
                Post your idea, connect with people who believe in it, and take the first step toward funding. The right spark can light up your future.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button 
                size="lg" 
                className="bg-black hover:bg-gray-800 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={handlePostIdea}
              >
                Post idea
              </Button>
            </div>
          </div>

          {/* Right Image with overlapping Stats Card */}
          <div className="relative order-1 lg:order-2">
            <div className="relative">
              {/* Main image */}
              <div className="relative z-10">
                <Image
                  src="/images/spark/ideaholing.jpg"
                  alt="Woman holding IDEA bubble with thumbs up"
                  width={500}
                  height={600}
                  className="object-cover w-full max-w-sm sm:max-w-md lg:max-w-lg rounded-[4rem_0_0_0]"
                  style={{ 
                    borderRadius: '4rem 0 0 0'
                  }}
                  priority
                />
              </div>
              
              {/* Stats Card overlapping the bottom-left corner of the image */}
              <div className="absolute -bottom-2 sm:-bottom-4 -left-2 sm:-left-6 z-30">
                <div className="bg-white/90 backdrop-blur rounded-lg sm:rounded-xl p-2 sm:p-3 shadow-lg border border-gray-200 max-w-[200px] sm:max-w-xs">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900">Ideas Stats</h3>
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-gray-700" />
                  </div>
                  {loading ? (
                    <div className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Loading...</div>
                  ) : stats ? (
                    <>
                      <div className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                        {stats.totalIdeas.toLocaleString()} Ideas
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        {/* Pie Chart */}
                        <div className="relative">
                          <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 sm:border-4 border-gray-200 relative">
                            {/* Approved segment */}
                            <div 
                              className="absolute inset-0 rounded-full border-2 sm:border-4 border-gray-800" 
                              style={{ 
                                clipPath: stats.totalIdeas > 0 ? `polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 50% 100%)` : 'none'
                              }}
                            ></div>
                            {/* Pending segment */}
                            <div 
                              className="absolute inset-0 rounded-full border-2 sm:border-4 border-gray-500" 
                              style={{ 
                                clipPath: stats.totalIdeas > 0 ? `polygon(50% 50%, 50% 0%, 0% 0%, 0% 50%)` : 'none'
                              }}
                            ></div>
                            {/* Center percentage */}
                            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
                              {stats.totalIdeas > 0 ? Math.round((stats.approvedIdeas / stats.totalIdeas) * 100) : 0}%
                            </div>
                          </div>
                        </div>
                        {/* Stats */}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-900 rounded-full"></div>
                            <span className="text-xs text-gray-700">{stats.approvedIdeas} Approved</span>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-500 rounded-full"></div>
                            <span className="text-xs text-gray-700">{stats.pendingIdeas} Pending</span>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-300 rounded-full"></div>
                            <span className="text-xs text-gray-700">{stats.engagementRate}% Engagement</span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-lg sm:text-xl font-bold text-gray-900 mb-2">No data</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Removed wave decoration for closer integration with grid */}
    </section>
  );
}
