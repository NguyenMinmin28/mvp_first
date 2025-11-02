"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ImgWithShimmer } from "@/ui/components/image-with-shimmer";

export default function Workspace() {
  const { status } = useSession();
  return (
    <section className="w-full py-2 md:py-3">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">Login to your workspace</h2>
            <p className="text-sm text-gray-700 mb-3">
              Access projects, contracts, payments & connections in one place.
            </p>
            {status !== "authenticated" ? (
              <div className="flex items-center gap-4">
                <Link 
                  href="/auth/signin" 
                  className="inline-flex items-center h-10 px-5 rounded-xl bg-black text-white text-sm hover:bg-gray-800 hover:scale-105 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
                >
                  Login to your account
                </Link>
                <Link 
                  href="/auth/signup" 
                  className="underline-animated text-sm text-gray-700 hover:text-black transition-all duration-200 cursor-pointer"
                >
                  Create an account
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link 
                  href="/projects" 
                  className="inline-flex items-center h-10 px-5 rounded-xl bg-black text-white text-sm hover:bg-gray-800 hover:scale-105 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
                >
                  Go to my projects
                </Link>
                <Link 
                  href="/profile" 
                  className="underline-animated text-sm text-gray-700 hover:text-black transition-all duration-200 cursor-pointer"
                >
                  Manage profile
                </Link>
              </div>
            )}
          </div>
          <div>
            <ImgWithShimmer 
              src="/images/home/workplace.png" 
              alt="workspace" 
              aspectRatio="16/9"
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}


