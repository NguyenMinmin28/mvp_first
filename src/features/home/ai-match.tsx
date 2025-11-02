"use client";

import Link from "next/link";
import { ImgWithShimmer } from "@/ui/components/image-with-shimmer";

export default function AiMatch() {
  return (
    <section className="w-full py-2 md:py-3">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-center">
          <div className="order-2 md:order-1">
            <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">AI Match. Direct Contact.</h3>
            <p className="text-sm text-gray-700 mb-3">
              AI finds the right freelancer — Basic, Mid-Level, or Expert. Connect instantly on WhatsApp, no middleman.
            </p>
            <div className="flex items-center gap-3 md:gap-4">
              <Link 
                href="/auth/signin" 
                className="inline-flex items-center h-10 px-5 rounded-xl bg-black text-white text-sm hover:bg-gray-800 hover:scale-105 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
              >
                Get Started
              </Link>
              <Link 
                href="/pricing" 
                className="underline-animated text-sm text-gray-700 hover:text-black transition-all duration-200 cursor-pointer"
              >
                Check out our solutions
              </Link>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <ImgWithShimmer 
              src="/images/home/aimatch.png" 
              alt="AI Match" 
              aspectRatio="16/9"
              className="w-full h-auto rounded-xl object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}


