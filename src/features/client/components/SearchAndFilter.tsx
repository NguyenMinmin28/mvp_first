"use client";

import { useState } from "react";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Search, SlidersHorizontal } from "lucide-react";

export function SearchAndFilter() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"people" | "service">("people");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const filterOptions = [
    "Featured",
    "Trending", 
    "Graphics & Design",
    "Programming & Tech",
    "Video & Animation",
    "Writing & Translation",
    "Music & Audio"
  ];

  const handleFilterClick = (filter: string) => {
    setSelectedFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  return (
    <div className="w-full space-y-4">
      {/* Search Bar and Toggle */}
      <div className="flex items-center gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search across 1M+ independents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base rounded-lg border-gray-300 focus:border-gray-400 focus:ring-0"
          />
        </div>

        {/* People/Service Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("people")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "people"
                ? "bg-white text-black shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            People
          </button>
          <button
            onClick={() => setActiveTab("service")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "service"
                ? "bg-white text-black shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Service
          </button>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Filter Button */}
        <Button
          variant="outline"
          className="h-9 px-4 border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium"
        >
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filter
        </Button>

        {/* Filter Options */}
        {filterOptions.map((filter) => (
          <button
            key={filter}
            onClick={() => handleFilterClick(filter)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              selectedFilters.includes(filter)
                ? "bg-[#F5F6F9] text-gray-900"
                : "text-[#A3A3A3] hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>
    </div>
  );
}

export default SearchAndFilter;
