"use client";

import Link from "next/link";

export default function AiMatch() {
  return (
    <section className="w-full py-10 md:py-16">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="order-2 md:order-1">
            <h3 className="text-3xl font-extrabold tracking-tight mb-4">AI Match. Direct Contact.</h3>
            <p className="text-gray-700 mb-6">
              AI finds the right freelancer — Basic, Mid-Level, or Expert. Connect instantly on WhatsApp, no middleman.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/auth/signin" className="inline-flex items-center h-10 px-5 rounded-xl bg-black text-white">Get Started</Link>
              <Link href="/pricing" className="underline text-sm text-gray-700">Check out our solutions</Link>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <img src="/images/home/aimatch.png" alt="AI Match" className="w-full h-auto rounded-xl object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
}


