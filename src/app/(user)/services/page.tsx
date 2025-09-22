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

  // Set initial tab based on URL parameter
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "people") {
      setActiveTab("people");
    } else {
      setActiveTab("service");
    }
  }, [searchParams]);

  // Handle tab change and update URL
  const handleTabChange = (tab: "people" | "service") => {
    setActiveTab(tab);
    const newSearchParams = new URLSearchParams(searchParams.toString());
    if (tab === "people") {
      newSearchParams.set("tab", "people");
    } else {
      newSearchParams.delete("tab");
    }
    router.push(`/services?${newSearchParams.toString()}`);
  };

  return (
    <UserLayout user={session?.user}>
      {/* Header Section */}
      <div className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Browse Talent, Contact Direct
              </h1>
            </div>
            
            {isDeveloper && (
              <Link href="/services/create">
                <Button 
                  variant="outline" 
                  className="border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Post Project
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
            hideHeaderControls
          />
        )}
      </div>
    </UserLayout>
  );
}
