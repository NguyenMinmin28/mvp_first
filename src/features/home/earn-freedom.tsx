"use client";

import Link from "next/link";

export default function EarnFreedom() {
  return (
    <section className="w-full py-10 md:py-16">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <img src="/images/home/earnfreedom.png" alt="Earn with Freedom & Respect" className="w-full h-auto rounded-xl object-cover" />
          </div>
          <div>
            <h3 className="text-3xl font-extrabold tracking-tight mb-4">Earn with Freedom & Respect</h3>
            <p className="text-gray-700 mb-6 text-sm md:text-base">
              Work directly with clients, set your own terms, and get paid with 0% fees. Build partnerships built on mutual respect.
            </p>
            <Link href="/auth/signin" className="inline-flex items-center h-10 px-5 rounded-xl bg-black text-white">Get Started</Link>
          </div>
        </div>
      </div>
    </section>
  );
}


