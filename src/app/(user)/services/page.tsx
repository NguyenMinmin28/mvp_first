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
      {/* Header Section - Mobile optimized */}
      <div className="border-b border-gray-200">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 break-words">
                Browse Talent, Contact Direct
              </h1>
            </div>
            
            {isDeveloper && (
              <Link href="/services/create" className="w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-900 text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Post Service</span>
                  <span className="sm:hidden">Post</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filter Section - Mobile optimized */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <SearchAndFilter 
          onSearchChange={setSearchQuery}
          onTabChange={handleTabChange}
          onFiltersChange={setSelectedFilters}
          onSkillsChange={setSelectedSkills}
          activeTab={activeTab}
          isDeveloper={isDeveloper}
        />
      </div>

      {/* Content Grid - Services or People - Mobile optimized */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
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
          />
        )}
      </div>
    </UserLayout>
  );
}
