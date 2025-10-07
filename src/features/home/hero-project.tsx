"use client";

import { useEffect, useRef, useState } from "react";
import { ProjectPostForm } from "@/features/client/components/project-post-form";

export function HeroProject() {
  const formContentRef = useRef<HTMLDivElement | null>(null);
  const [rightHeight, setRightHeight] = useState<number | undefined>(undefined);
  const [isVisible, setIsVisible] = useState(false);
  // Keep image container height synced with form content
  const IMAGE_SCALE = 1.0;

  useEffect(() => {
    const sync = () => {
      const formContainer = formContentRef.current;
      if (formContainer) {
        // Get the full height of the form container including padding
        const formRect = formContainer.getBoundingClientRect();
        // Add mt-16 (64px) to match the banner's top margin
        setRightHeight(formRect.height + 64);
      }
    };
    sync();
    const ro =
      typeof window !== "undefined" && "ResizeObserver" in window
        ? new ResizeObserver(sync)
        : null;
    if (ro && formContentRef.current) ro.observe(formContentRef.current);
    window.addEventListener("resize", sync);
    return () => {
      window.removeEventListener("resize", sync);
      if (ro && formContentRef.current) ro.unobserve(formContentRef.current);
    };
  }, []);

  useEffect(() => {
    // Trigger animation on mount
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="w-full py-8 md:py-4">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr] lg:grid-cols-[0.8fr_1.2fr] gap-6 md:gap-8 items-end">
          {/* Left: Form column */}
          <div 
            className={`md:pr-4 transition-all duration-1000 transform ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            }`}
            ref={formContentRef}
          >
            <div className="bg-[#FFFFFF] rounded-lg p-8 border-0 shadow-sm hover:shadow-xl transition-shadow duration-500">
              <ProjectPostForm
                title="Post Project"
                description=""
                showLoginLink={true}
              />
            </div>
          </div>

          {/* Right: Image column */}
          <div className={`w-full transition-all duration-1000 delay-200 transform ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
          }`}>
            <div
              className="bg-[#FFFAF3] overflow-hidden flex items-center justify-center p-8 mt-16 rounded-lg hover:shadow-lg transition-all duration-500"
              style={{
                height: rightHeight ? `${rightHeight}px` : "auto",
              }}
            >
              <img
                alt="Hire freelancer directly"
                src="/images/home/herobanner2.png"
                className="max-h-full max-w-full object-contain transition-transform duration-700 hover:scale-105"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroProject;
