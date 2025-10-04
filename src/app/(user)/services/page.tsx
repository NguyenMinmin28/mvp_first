"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/ui/components/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { UserLayout } from "@/features/shared/components/user-layout";
import SearchAndFilter from "@/features/client/components/SearchAndFilter";
import ServicesGrid from "@/features/client/components/ServicesGrid";
import PeopleGrid from "@/features/client/components/PeopleGrid";

export default function ServicesPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isDeveloper = session?.user?.role === "DEVELOPER";
  
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"people" | "service">("service");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  // Debug logs
  useEffect(() => {
    console.log('🔍 Services page - selectedFilters:', selectedFilters, 'selectedSkills:', selectedSkills);
  }, [selectedFilters, selectedSkills]);

  // Set initial tab based on URL parameter
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "people") {
      setActiveTab("people");
    } else {
      setActiveTab("service");
    }
  }, [searchParams]);

  // No longer needed - using developer-based approach instead

  // Handle tab change and update URL
  const handleTabChange = (tab: "people" | "service") => {
    setActiveTab(tab);
    const newSearchParams = new URLSearchParams(searchParams.toString());
    if (tab === "people") {
      newSearchParams.set("tab", "people");
    } else {
      newSearchParams.delete("tab");
    }
    const cleanUrl = `/services${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ""}`;
    router.push(cleanUrl);
  };

  return (
    <UserLayout user={session?.user}>
      {/* Header Section with enhanced animations */}
      <div className="border-b border-gray-200 relative overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-purple-50/30 to-pink-50/30 animate-pulse"></div>
        
        <div className="container mx-auto px-4 py-6 relative">
          <div className="flex items-center justify-between">
            <div className="group">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 transition-all duration-500 group-hover:scale-105 group-hover:text-blue-600">
                Browse Talent, Contact Direct
              </h1>
              {/* Animated underline */}
              <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 w-0 group-hover:w-full transition-all duration-700 ease-out mt-2"></div>
            </div>
            
            {isDeveloper && (
              <Link href="/services/create">
                <Button 
                  variant="outline" 
                  className="border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-300 transform hover:scale-105 hover:shadow-lg group"
                >
                  <Plus className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:rotate-90" />
                  Post Service
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="container mx-auto px-4 py-6">
        <SearchAndFilter 
          onSearchChange={setSearchQuery}
          onTabChange={handleTabChange}
          onFiltersChange={setSelectedFilters}
          onSkillsChange={setSelectedSkills}
          activeTab={activeTab}
          isDeveloper={isDeveloper}
        />
      </div>

      {/* Content Grid - Services or People */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === "service" ? (
          <ServicesGrid 
            searchQuery={searchQuery}
            sortBy="popular"
            filters={selectedFilters}
            isDeveloper={isDeveloper}
          />
        ) : (
          <PeopleGrid 
            searchQuery={searchQuery}
            sortBy="popular"
            filters={selectedFilters}
            skills={selectedSkills}
            hideHeaderControls
            isDeveloper={isDeveloper}
          />
        )}
      </div>
    </UserLayout>
  );
}
