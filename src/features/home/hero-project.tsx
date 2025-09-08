"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/ui/components/card";
import { ProjectPostForm } from "@/features/client/components/project-post-form";

export function HeroProject() {
  const formContentRef = useRef<HTMLDivElement | null>(null);
  const [rightHeight, setRightHeight] = useState<number | undefined>(undefined);
  // Tuning factor to make image slightly shorter than form content
  const IMAGE_SCALE = 1.2; // slight increase

  useEffect(() => {
    const sync = () => {
      const el = formContentRef.current?.querySelector('.project-form-content') as HTMLElement | null;
      if (el) setRightHeight(el.clientHeight);
    };
    sync();
    const ro = typeof window !== "undefined" && "ResizeObserver" in window ? new ResizeObserver(sync) : null;
    if (ro && formContentRef.current) ro.observe(formContentRef.current);
    window.addEventListener("resize", sync);
    return () => {
      window.removeEventListener("resize", sync);
      if (ro && formContentRef.current) ro.unobserve(formContentRef.current);
    };
  }, []);
  return (
    <section className="w-full py-8 md:py-16">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-6 md:gap-8 items-stretch">
          {/* Left: Form column */}
          <div className="md:pr-4" ref={formContentRef}>
            <ProjectPostForm 
              title="Find Freelancer"
              description="Post your project and find the perfect freelancer"
              showLoginLink={true}
            />
          </div>

          {/* Right: Image column */}
          <div className="w-full" style={{ height: rightHeight ? Math.round(rightHeight * IMAGE_SCALE) : undefined }}>
            <Card className="h-full">
              <CardContent className="p-0 flex items-center justify-center bg-white h-full">
                <img
                  alt="Hire freelancer directly"
                  src="/images/home/clerves.webp"
                  className="h-full w-auto object-contain"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroProject;
