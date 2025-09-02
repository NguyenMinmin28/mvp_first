"use client";

import Image from "next/image";
import { Button } from "@/ui/components/button";
import { Zap, TrendingUp, Users, Lightbulb, LogIn } from "lucide-react";
import { useSession } from "next-auth/react";

export function IdeaSparkHero() {
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
                onClick={() => window.location.href = '/ideas/submit'}
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
                  className="object-cover w-full max-w-sm sm:max-w-md lg:max-w-lg"
                  style={{ 
                    borderRadius: '4rem 0 0 0'
                  }}
                  priority
                />
              </div>
              
              {/* Stats Card overlapping the bottom-left corner of the image */}
              <div className="absolute -bottom-2 sm:-bottom-4 -left-2 sm:-left-6 z-30">
                <div className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 shadow-lg border border-gray-100 max-w-[200px] sm:max-w-xs">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900">Earnings Received</h3>
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-gray-900 mb-2">$45,000</div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* Pie Chart */}
                    <div className="relative">
                      <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 sm:border-4 border-gray-200 relative">
                        {/* Purple segment (73%) */}
                        <div className="absolute inset-0 rounded-full border-2 sm:border-4 border-purple-500" style={{ clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 50% 100%)' }}></div>
                        {/* Yellow segment (15%) */}
                        <div className="absolute inset-0 rounded-full border-2 sm:border-4 border-yellow-400" style={{ clipPath: 'polygon(50% 50%, 50% 0%, 0% 0%, 0% 50%)' }}></div>
                        {/* Blue segment (12%) */}
                        <div className="absolute inset-0 rounded-full border-2 sm:border-4 border-blue-500" style={{ clipPath: 'polygon(50% 50%, 0% 50%, 0% 100%, 50% 100%)' }}></div>
                        {/* Center percentage */}
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">73%</div>
                      </div>
                    </div>
                    {/* Horizontal Bar Charts */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-xs text-gray-600">73% Funded</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-400 rounded-full"></div>
                        <span className="text-xs text-gray-600">15% Pending</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-xs text-gray-600">12% Other</span>
                      </div>
                    </div>
                  </div>
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
