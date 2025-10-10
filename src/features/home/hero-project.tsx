"use client";

import { useEffect, useRef, useState } from "react";
import { ProjectPostForm } from "@/features/client/components/project-post-form";

export function HeroProject() {
  const formContentRef = useRef<HTMLDivElement | null>(null);
  const [rightHeight, setRightHeight] = useState<number | undefined>(undefined);
  // Keep image container height synced with form content
  const IMAGE_SCALE = 1.0;

  useEffect(() => {
    const sync = () => {
      const formContainer = formContentRef.current;
      if (formContainer) {
        // Get the height from the title element to the bottom of the form
        const titleElement = formContainer.querySelector("h1");
        if (titleElement) {
          const titleRect = titleElement.getBoundingClientRect();
          const formRect = formContainer.getBoundingClientRect();
          // Calculate height from title position to bottom of form
          const heightFromTitle = formRect.bottom - titleRect.top;
          setRightHeight(heightFromTitle);
        }
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
  return (
    <section className="w-full py-8 md:py-4">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr] lg:grid-cols-[0.8fr_1.2fr] gap-6 md:gap-8 items-start">
          {/* Left: Form column */}
          <div className="md:pr-4" ref={formContentRef}>
            <div className="bg-[#FFFFFF] rounded-lg p-6 border-0">
              <ProjectPostForm
                title="Post Project"
                description=""
                showLoginLink={true}
              />
            </div>
          </div>

          {/* Right: Image column */}
          <div className="w-full">
            <div
              className="bg-[#FFFAF3] overflow-hidden flex items-center justify-center p-8 mt-16"
              style={{
                height: rightHeight ? `${rightHeight * 0.9}px` : "auto",
              }}
            >
              <img
                alt="Hire freelancer directly"
                src="/images/home/herobanner2.png"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroProject;
