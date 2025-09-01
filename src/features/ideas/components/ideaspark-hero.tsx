"use client";

import Image from "next/image";
import { Button } from "@/ui/components/button";
import { Zap, TrendingUp, Users, Lightbulb } from "lucide-react";

export function IdeaSparkHero() {
  return (
    <section className="relative bg-white flex items-start pt-8">
      <div className="container mx-auto px-4 py-7">
        <div className="grid lg:grid-cols-2 gap-24 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
              </div>
              
              <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 leading-tight whitespace-nowrap">
                IdeaSpark: Where Ideas Find Backers
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                Post your idea, connect with people who believe in it, and take the first step toward funding. The right spark can light up your future.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-black hover:bg-gray-800 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                Post idea
              </Button>
            </div>
          </div>

          {/* Right Image with overlapping Stats Card */}
          <div className="relative lg:order-2">
            <div className="relative">
              {/* Main image */}
              <div className="relative z-10">
                <Image
                  src="/images/spark/ideaholing.jpg"
                  alt="Woman holding IDEA bubble with thumbs up"
                  width={500}
                  height={600}
                  className="object-cover w-full max-w-lg"
                  style={{ 
                    borderRadius: '8rem 0 0 0'
                  }}
                  priority
                />
              </div>
              
              {/* Stats Card overlapping the bottom-left corner of the image */}
              <div className="absolute -bottom-4 -left-6 z-30">
                <div className="bg-white rounded-xl p-3 shadow-lg border border-gray-100 max-w-xs">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-900">Earnings Received</h3>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="text-xl font-bold text-gray-900 mb-2">$45,000</div>
                  <div className="flex items-center gap-3">
                    {/* Pie Chart */}
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full border-4 border-gray-200 relative">
                        {/* Purple segment (73%) */}
                        <div className="absolute inset-0 rounded-full border-4 border-purple-500" style={{ clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 50% 100%)' }}></div>
                        {/* Yellow segment (15%) */}
                        <div className="absolute inset-0 rounded-full border-4 border-yellow-400" style={{ clipPath: 'polygon(50% 50%, 50% 0%, 0% 0%, 0% 50%)' }}></div>
                        {/* Blue segment (12%) */}
                        <div className="absolute inset-0 rounded-full border-4 border-blue-500" style={{ clipPath: 'polygon(50% 50%, 0% 50%, 0% 100%, 50% 100%)' }}></div>
                        {/* Center percentage */}
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">73%</div>
                      </div>
                    </div>
                    {/* Horizontal Bar Charts */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-xs text-gray-600">73% Funded</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <span className="text-xs text-gray-600">15% Pending</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
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
