"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function EarnFreedom() {
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
          <div className={`transition-all duration-1000 transform ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
          }`}>
            <img src="/images/home/free.png" alt="Earn with Freedom & Respect" className="w-full h-auto rounded-xl object-cover shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105" />
          </div>
          <div className={`transition-all duration-1000 delay-200 transform ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
          }`}>
            <h3 className="text-3xl font-extrabold tracking-tight mb-4">Earn with Freedom & Respect</h3>
            <p className="text-gray-700 mb-6 text-sm md:text-base">
              Work directly with clients, set your own terms, and get paid with 0% fees. Build partnerships built on mutual respect.
            </p>
            <Link href="/auth/signin" className="inline-flex items-center h-10 px-5 rounded-xl bg-black text-white hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 hover:shadow-xl">Get Started</Link>
          </div>
        </div>
      </div>
    </section>
  );
}


