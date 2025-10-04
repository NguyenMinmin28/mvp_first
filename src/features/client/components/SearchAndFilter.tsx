"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Search, SlidersHorizontal, ChevronDown, ChevronUp, X } from "lucide-react";
import { useDebounce } from "@/features/shared/hooks/use-debounce";

interface Skill {
  id: string;
  name: string;
  _count: {
    developers: number;
  };
}

interface SearchAndFilterProps {
  onSearchChange?: (searchQuery: string) => void;
  onTabChange?: (tab: "people" | "service") => void;
  onFiltersChange?: (filters: string[]) => void;
  onSkillsChange?: (skills: string[]) => void;
  activeTab?: "people" | "service"; // allow parent to control active tab
  isDeveloper?: boolean; // to show "My Services" filter for developers
}

export function SearchAndFilter({ 
  onSearchChange, 
  onTabChange, 
  onFiltersChange,
  onSkillsChange,
  activeTab: externalActiveTab,
  isDeveloper = false,
}: SearchAndFilterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [internalActiveTab, setInternalActiveTab] = useState<"people" | "service">("service");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [showSkillsFilter, setShowSkillsFilter] = useState(false);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [skillsSearch, setSkillsSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Use external activeTab if provided, otherwise use internal state
  const activeTab = externalActiveTab ?? internalActiveTab;
  
  // Debounce search query to avoid too many API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const debouncedSkillsSearch = useDebounce(skillsSearch, 300);

  // Notify parent components of changes
  useEffect(() => {
    onSearchChange?.(debouncedSearchQuery);
  }, [debouncedSearchQuery, onSearchChange]);

  useEffect(() => {
    onTabChange?.(activeTab);
  }, [activeTab, onTabChange]);

  useEffect(() => {
    onFiltersChange?.(selectedFilters);
  }, [selectedFilters, onFiltersChange]);

  useEffect(() => {
    console.log('🔍 SearchAndFilter - selectedSkills changed:', selectedSkills);
    onSkillsChange?.(selectedSkills);
  }, [selectedSkills, onSkillsChange]);

  // Fetch skills when Others filter is selected
  useEffect(() => {
    if (selectedFilters.includes("Others") && activeTab === "people") {
      fetchSkills(debouncedSkillsSearch);
    }
  }, [selectedFilters, activeTab, debouncedSkillsSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSkillsFilter(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchSkills = async (searchTerm = '') => {
    setSkillsLoading(true);
    try {
      const url = searchTerm 
        ? `/api/skills?limit=100&search=${encodeURIComponent(searchTerm)}`
        : '/api/skills?limit=100';
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setSkills(data.skills || []);
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
    } finally {
      setSkillsLoading(false);
    }
  };

  const filterOptions = activeTab === "people" 
    ? [
        "Starter",
        "Professional", 
        "Ready to Work",
        "Others"
      ]
    : [
        // Show "My Services" first for developers when on service tab
        ...(isDeveloper && activeTab === "service" ? ["My Services"] : []),
        "Featured",
        "Trending", 
        "Graphics & Design",
        "Programming & Tech",
        "Video & Animation",
        "Writing & Translation",
        "Music & Audio"
      ];

  const handleFilterClick = (filter: string) => {
    setSelectedFilters(prev => {
      const newFilters = prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter];
      
      // If Others is deselected, clear skills selection
      if (filter === "Others" && !newFilters.includes("Others")) {
        setSelectedSkills([]);
        setShowSkillsFilter(false);
      }
      
      return newFilters;
    });
  };

  const handleSkillClick = (skillId: string) => {
    console.log('🔍 SearchAndFilter - handleSkillClick:', skillId, 'current skills:', selectedSkills);
    setSelectedSkills(prev => {
      const newSkills = prev.includes(skillId) 
        ? prev.filter(s => s !== skillId)
        : [...prev, skillId];
      console.log('🔍 SearchAndFilter - new skills:', newSkills);
      return newSkills;
    });
  };

  const toggleSkillsFilter = () => {
    setShowSkillsFilter(!showSkillsFilter);
  };

  const handleTabChange = (tab: "people" | "service") => {
    // If external activeTab is provided, only notify parent
    // Otherwise, update internal state
    if (externalActiveTab !== undefined) {
      onTabChange?.(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Search Bar and Toggle */}
      <div className="flex items-center gap-4">
        {/* Search Input with enhanced animations */}
        <div className="flex-1 relative group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-all duration-300 group-focus-within:text-blue-500 group-focus-within:scale-110" />
          <Input
            type="text"
            placeholder={activeTab === "service" ? "Search services, skills, categories..." : "Search developers"}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 h-12 text-base rounded-lg border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-300 hover:border-gray-400 hover:shadow-md focus:shadow-lg"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-all duration-300 hover:scale-110"
            >
              ✕
            </button>
          )}
          {/* Animated search indicator */}
          {searchQuery && (
            <div className="absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 w-full rounded-full animate-pulse"></div>
          )}
        </div>

        {/* People/Service Toggle with enhanced animations */}
        <div className="flex bg-gray-100 rounded-lg p-1 relative">
          {/* Animated background slider */}
          <div 
            className={`absolute top-1 bottom-1 bg-white rounded-md shadow-sm transition-all duration-300 ease-out ${
              activeTab === "people" ? "left-1 w-[calc(50%-0.25rem)]" : "left-[calc(50%+0.25rem)] w-[calc(50%-0.25rem)]"
            }`}
          />
          <button
            onClick={() => handleTabChange("people")}
            className={`relative px-4 py-2 text-sm font-medium rounded-md transition-all duration-300 z-10 ${
              activeTab === "people"
                ? "text-black font-semibold"
                : "text-gray-600 hover:text-gray-800 hover:scale-105"
            }`}
          >
            People
          </button>
          <button
            onClick={() => handleTabChange("service")}
            className={`relative px-4 py-2 text-sm font-medium rounded-md transition-all duration-300 z-10 ${
              activeTab === "service"
                ? "text-black font-semibold"
                : "text-gray-600 hover:text-gray-800 hover:scale-105"
            }`}
          >
            Service
          </button>
        </div>
      </div>

      {/* Filter Buttons with enhanced animations */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Filter Button */}
        <Button
          variant="outline"
          className="h-9 px-4 border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-md group"
        >
          <SlidersHorizontal className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:rotate-180" />
          Filter
        </Button>

        {/* Filter Options with enhanced animations */}
        {filterOptions.map((filter, index) => (
          <button
            key={filter}
            onClick={() => handleFilterClick(filter)}
            className={`px-4 py-2 text-sm font-medium transition-all duration-300 transform hover:scale-105 rounded-lg ${
              selectedFilters.includes(filter)
                ? "bg-[#F5F6F9] text-gray-900 shadow-md scale-105"
                : "text-[#A3A3A3] hover:text-gray-700 hover:bg-gray-50 hover:shadow-sm"
            }`}
            style={{
              animationDelay: `${index * 100}ms`,
              animation: 'fadeInUp 0.5s ease-out forwards'
            }}
          >
            {filter}
            {selectedFilters.includes(filter) && (
              <span className="ml-2 text-blue-500 animate-bounce">✓</span>
            )}
          </button>
        ))}
      </div>

      {/* Skills Dropdown for Others category */}
      {activeTab === "people" && selectedFilters.includes("Others") && (
        <div className="border-t border-gray-200 pt-4">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={toggleSkillsFilter}
              className="flex items-center justify-between w-full px-4 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span className="text-gray-700">
                {selectedSkills.length > 0 
                  ? `${selectedSkills.length} skill(s) selected` 
                  : "Select skills to filter..."
                }
              </span>
              {showSkillsFilter ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {showSkillsFilter && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {skillsLoading ? (
                  <div className="p-4 text-sm text-gray-500 text-center">Loading skills...</div>
                ) : (
                  <div className="p-2">
                    {/* Search input */}
                    <div className="mb-2">
                      <Input
                        type="text"
                        placeholder="Search skills..."
                        value={skillsSearch}
                        onChange={(e) => setSkillsSearch(e.target.value)}
                        className="w-full text-sm"
                      />
                    </div>
                    
                    {skills.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500 text-center">
                        {skillsSearch ? 'No skills found' : 'No skills available'}
                      </div>
                    ) : (
                      skills.map((skill) => (
                        <button
                          key={skill.id}
                          onClick={() => handleSkillClick(skill.id)}
                          className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                            selectedSkills.includes(skill.id)
                              ? "bg-blue-100 text-blue-700"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{skill.name}</span>
                            <span className="text-xs text-gray-500">({skill._count.developers})</span>
                          </div>
                        </button>
                      ))
                    )}
                    
                    {selectedSkills.length > 0 && (
                      <div className="border-t border-gray-200 mt-2 pt-2">
                        <button
                          onClick={() => setSelectedSkills([])}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                        >
                          Clear all selections
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchAndFilter;
