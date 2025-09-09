"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/ui/components/card";
import { ProjectPostForm } from "@/features/client/components/project-post-form";

export function HeroProject() {
  const formContentRef = useRef<HTMLDivElement | null>(null);
  const [rightHeight, setRightHeight] = useState<number | undefined>(undefined);
  // Keep image container height synced with form content
  const IMAGE_SCALE = 1.0;

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
        <div className="grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr] lg:grid-cols-[0.8fr_1.2fr] gap-6 md:gap-8 items-stretch">
          {/* Left: Form column */}
          <div className="md:pr-4" ref={formContentRef}>
            <ProjectPostForm 
              title="Post Project"
              description=""
              showLoginLink={true}
            />
          </div>

          {/* Right: Image column */}
          <div className="w-full">
            <Card className="h-full">
              <CardContent className="p-0 h-full">
                <div className="relative h-[280px] sm:h-[360px] md:h-full w-full overflow-hidden rounded-xl">
                  <img
                    alt="Hire freelancer directly"
                    src="/images/home/herobanner2.png"
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroProject;
