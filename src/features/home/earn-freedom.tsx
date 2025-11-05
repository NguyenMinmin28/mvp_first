"use client";

import Link from "next/link";
import { ImgWithShimmer } from "@/ui/components/image-with-shimmer";

export default function EarnFreedom() {
  return (
    <section className="w-full py-2 md:py-3 mb-8 sm:mb-12 lg:mb-16">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-center">
          <div>
            <ImgWithShimmer 
              src="/images/home/free.png" 
              alt="Earn with Freedom & Respect" 
              aspectRatio="16/9"
              className="w-full h-auto rounded-xl object-cover"
            />
          </div>
          <div>
            <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">Earn with Freedom & Respect</h3>
            <p className="text-sm text-gray-700 mb-3">
              Work directly with clients, set your own terms, and get paid with 0% fees. Build partnerships built on mutual respect.
            </p>
            <Link 
              href="/auth/signin" 
              className="inline-flex items-center h-10 px-5 rounded-xl bg-black text-white text-sm hover:bg-gray-800 hover:scale-105 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}


