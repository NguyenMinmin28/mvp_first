"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ImgWithShimmer } from "@/ui/components/image-with-shimmer";

export default function ContactDirect() {
  const { status } = useSession();
  return (
    <section className="w-full py-2 md:py-3">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-center">
          <div>
            <ImgWithShimmer 
              src="/images/home/directconnet.png" 
              alt="Contact Direct. No Middleman." 
              aspectRatio="16/9"
              className="w-full h-auto rounded-xl object-cover"
            />
          </div>
          <div>
            <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">Contact Direct. No Middleman.</h3>
            <p className="text-sm text-gray-700 mb-3">
              Connect with freelancers and clients instantly—no agents, no hidden costs. Work together with 0% fees on both sides and keep every rupee you earn.
            </p>
            {status !== "authenticated" ? (
              <div className="flex items-center gap-3 md:gap-4">
                <Link 
                  href="/auth/signin" 
                  className="inline-flex items-center h-10 px-5 rounded-xl bg-black text-white text-sm hover:bg-gray-800 hover:scale-105 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
                >
                  Get Started
                </Link>
                <Link 
                  href="/auth/signin" 
                  className="underline-animated text-sm text-gray-700 hover:text-black transition-all duration-200 cursor-pointer"
                >
                  Already have an account? Sign in
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3 md:gap-4">
                <Link 
                  href="/projects" 
                  className="inline-flex items-center h-10 px-5 rounded-xl bg-black text-white text-sm hover:bg-gray-800 hover:scale-105 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
                >
                  Go to Projects
                </Link>
                <Link 
                  href="/profile" 
                  className="underline-animated text-sm text-gray-700 hover:text-black transition-all duration-200 cursor-pointer"
                >
                  Manage Profile
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}


