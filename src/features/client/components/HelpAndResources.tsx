"use client";

import { Card, CardContent } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Rocket, BookOpen, Users, MessageCircle, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export function HelpAndResources() {
  const resources = [
    {
      id: 1,
      category: "Getting Started",
      title: "Complete guide to hiring freelancers and managing projects",
      description: "Learn the fundamentals of working with talented freelancers",
      icon: Rocket,
      isFeatured: true,
      gradient: "from-gray-50 to-gray-100",
      href: "/help/getting-started",
    },
    {
      id: 2,
      category: "Best Practices",
      title: "How to write effective project briefs",
      description: "Create clear, detailed briefs that attract top talent",
      icon: BookOpen,
      isFeatured: false,
      gradient: "from-gray-50 to-gray-100",
      href: "/help/best-practices",
    },
    {
      id: 3,
      category: "Communication",
      title: "Building strong client-freelancer relationships",
      description: "Tips for effective collaboration and communication",
      icon: Users,
      isFeatured: false,
      gradient: "from-gray-50 to-gray-100",
      href: "/help/communication",
    },
    {
      id: 4,
      category: "Support",
      title: "Get help from our support team",
      description: "24/7 assistance for all your questions and concerns",
      icon: MessageCircle,
      isFeatured: false,
      gradient: "from-gray-50 to-gray-100",
      href: "/help/support",
    },
  ];

  return (
    <section className="w-full py-10 md:py-16 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/30 via-transparent to-gray-100/20 pointer-events-none" />
      
      <div className="container mx-auto max-w-8xl px-6 relative">
        {/* Header with enhanced styling */}
        <div className="flex items-center justify-between mb-12 animate-fade-in-up">
          <div className="flex items-center gap-3">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 hover:text-gray-700 transition-all duration-300 cursor-pointer title-glow">
              Help and Resources
            </h2>
            <Sparkles className="w-8 h-8 text-gray-400 animate-pulse" />
          </div>
          <Button className="bg-black text-white hover:bg-black/90 px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg group">
            <span className="flex items-center gap-2">
              View all resources
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </span>
          </Button>
        </div>

        {/* Content Grid with enhanced animations */}
        <div className="space-y-8">
          {/* Featured Card - Full Width Row 1 */}
          <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <Link href={resources[0].href}>
              <Card className="border border-gray-200 bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 group cursor-pointer overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${resources[0].gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <CardContent className="p-8 relative z-10">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-black rounded-full animate-pulse" />
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                          {resources[0].category}
                        </p>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-4 group-hover:text-gray-700 transition-colors duration-300">
                        {resources[0].title}
                      </h3>
                      <p className="text-gray-600 mb-6 leading-relaxed">
                        {resources[0].description}
                      </p>
                      <Button 
                        variant="outline" 
                        className="w-fit border-2 border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400 text-gray-900 rounded-lg transition-all duration-300 transform hover:scale-105 group/btn"
                      >
                        <span className="flex items-center gap-2">
                          Learn more
                          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
                        </span>
                      </Button>
                    </div>
                    <div className="ml-6 relative">
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                        <Rocket className="w-10 h-10 text-gray-600 group-hover:text-gray-800 transition-colors duration-300" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ArrowRight className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Smaller Cards - Row 2 with stagger animation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {resources.slice(1).map((resource, index) => {
              const IconComponent = resource.icon;
              return (
                <div 
                  key={resource.id} 
                  className="animate-fade-in-up" 
                  style={{ animationDelay: `${200 + index * 100}ms` }}
                >
                  <Link href={resource.href}>
                    <Card className="h-full border border-gray-200 bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 group cursor-pointer overflow-hidden">
                      <div className={`absolute inset-0 bg-gradient-to-br ${resource.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                      <CardContent className="p-6 h-full flex flex-col relative z-10">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                {resource.category}
                              </p>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 leading-tight mb-3 group-hover:text-gray-700 transition-colors duration-300">
                              {resource.title}
                            </h3>
                            <p className="text-sm text-gray-600 leading-relaxed mb-4">
                              {resource.description}
                            </p>
                          </div>
                          <div className="ml-3 relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                              <IconComponent className="w-6 h-6 text-gray-600 group-hover:text-gray-800 transition-colors duration-300" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <ArrowRight className="w-2 h-2 text-white" />
                            </div>
                          </div>
                        </div>
                        <div className="mt-auto">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="w-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-300 group/btn"
                          >
                            <span className="flex items-center justify-center gap-2">
                              Read more
                              <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform duration-300" />
                            </span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default HelpAndResources;
