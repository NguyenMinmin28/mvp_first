"use client";

import { Card, CardContent } from "@/ui/components/card";
import { ProjectPostForm } from "@/features/client/components/project-post-form";

export function HeroProject() {
  return (
    <section className="w-full py-8 md:py-12">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-6 md:gap-8 items-start">
          {/* Left: Form column */}
          <div className="md:h-[460px] md:pr-4">
            <ProjectPostForm 
              title="Find Freelancer"
              description="Post your project and find the perfect freelancer"
              showLoginLink={true}
            />
          </div>

          {/* Right: Image column */}
          <div className="w-full h-full md:h-[520px]">
            <Card className="overflow-hidden h-full md:h-full">
              <CardContent className="p-0">
                <img
                  alt="Hire freelancer directly"
                  src="/images/home/hireafreelance.png"
                  className="w-full h-full object-cover"
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
