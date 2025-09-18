"use client";

import { Card, CardContent } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Rocket } from "lucide-react";

export function HelpAndResources() {
  const resources = [
    {
      id: 1,
      category: "Get started",
      title: "Get started and connect with talent to get work done",
      isFeatured: true,
    },
    {
      id: 2,
      category: "Get started",
      title: "Get started and connect with talent to get work done",
      isFeatured: false,
    },
    {
      id: 3,
      category: "Get started", 
      title: "Get started and connect with talent to get work done",
      isFeatured: false,
    },
    {
      id: 4,
      category: "Get started",
      title: "Get started and connect with talent to get work done", 
      isFeatured: false,
    },
  ];

  return (
    <section className="w-full py-10 md:py-16">
      <div className="container mx-auto max-w-8xl px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-4xl font-extrabold text-gray-900">Help and Resources</h2>
          <Button className="bg-black text-white hover:bg-black/90 px-6 py-3 rounded-lg">
            View all recourses
          </Button>
        </div>

        {/* Content Grid */}
        <div className="space-y-6">
          {/* Featured Card - Full Width Row 1 */}
          <Card className="border border-gray-200 bg-white rounded-lg">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-2">{resources[0].category}</p>
                  <h3 className="text-lg font-bold text-gray-900 leading-tight mb-6">
                    {resources[0].title}
                  </h3>
                  <Button 
                    variant="outline" 
                    className="w-fit border border-gray-300 bg-white hover:bg-gray-50 text-gray-900 rounded-lg"
                  >
                    Learn more
                  </Button>
                </div>
                <div className="ml-4">
                  <Rocket className="w-16 h-16 text-gray-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Smaller Cards - Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {resources.slice(1).map((resource) => (
              <Card key={resource.id} className="h-full border border-gray-200 bg-white rounded-lg">
                <CardContent className="p-6 h-full flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 mb-2">{resource.category}</p>
                      <h3 className="text-sm font-bold text-gray-900 leading-tight">
                        {resource.title}
                      </h3>
                    </div>
                    <div className="ml-2">
                      <Rocket className="w-8 h-8 text-gray-300" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default HelpAndResources;
