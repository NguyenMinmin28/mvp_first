"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function AiMatch() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="w-full py-10 md:py-16">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className={`order-2 md:order-1 transition-all duration-1000 transform ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
          }`}>
            <h3 className="text-3xl font-extrabold tracking-tight mb-4">AI Match. Direct Contact.</h3>
            <p className="text-gray-700 mb-6">
              AI finds the right freelancer — Basic, Mid-Level, or Expert. Connect instantly on WhatsApp, no middleman.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/auth/signin" className="inline-flex items-center h-10 px-5 rounded-xl bg-black text-white hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 hover:shadow-xl">Get Started</Link>
              <Link href="/pricing" className="underline text-sm text-gray-700 hover:text-black transition-colors duration-300">Check out our solutions</Link>
            </div>
          </div>
          <div className={`order-1 md:order-2 transition-all duration-1000 delay-200 transform ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
          }`}>
            <img src="/images/home/aimatch.png" alt="AI Match" className="w-full h-auto rounded-xl object-cover shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105" />
          </div>
        </div>
      </div>
    </section>
  );
}


