"use client";

import { useState, useEffect } from "react";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/components/select";
import { Badge } from "@/ui/components/badge";
import { X, SlidersHorizontal, DollarSign } from "lucide-react";
import { CURRENCIES, getCurrency } from "@/core/utils/currency";

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterState) => void;
  initialFilters?: FilterState;
}

export interface FilterState {
  priceMin: string;
  priceMax: string;
  currency: string;
  paymentType: "fixed" | "hourly" | "both";
  level: string[];
  skills: string[];
  location: string;
  availability: string[];
}


const LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "professional", label: "Professional" },
  { value: "expert", label: "Expert" },
];

const AVAILABILITY_OPTIONS = [
  { value: "available", label: "Available Now" },
  { value: "busy", label: "Busy" },
  { value: "part-time", label: "Part-time" },
];

export function FilterDrawer({ isOpen, onClose, onApplyFilters, initialFilters }: FilterDrawerProps) {
  const [filters, setFilters] = useState<FilterState>({
    priceMin: "",
    priceMax: "",
    currency: "USD",
    paymentType: "both",
    level: [],
    skills: [],
    location: "",
    availability: [],
    ...initialFilters,
  });

  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillsSearch, setSkillsSearch] = useState("");
  const [availableSkills, setAvailableSkills] = useState<Array<{ id: string; name: string }>>([]);

  // Get current currency symbol
  const currentCurrency = getCurrency(filters.currency) || CURRENCIES[0];

  // Fetch skills when component mounts or search changes
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const response = await fetch(`/api/skills?search=${encodeURIComponent(skillsSearch)}&limit=20`);
        const data = await response.json();
        if (data.success) {
          setAvailableSkills(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching skills:", error);
      }
    };

    if (skillsSearch.length >= 2) {
      fetchSkills();
    } else {
      setAvailableSkills([]);
    }
  }, [skillsSearch]);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleLevelToggle = (level: string) => {
    setFilters(prev => ({
      ...prev,
      level: prev.level.includes(level)
        ? prev.level.filter(l => l !== level)
        : [...prev.level, level],
    }));
  };

  const handleAvailabilityToggle = (availability: string) => {
    setFilters(prev => ({
      ...prev,
      availability: prev.availability.includes(availability)
        ? prev.availability.filter(a => a !== availability)
        : [...prev.availability, availability],
    }));
  };

  const handleSkillAdd = (skill: { id: string; name: string }) => {
    if (!selectedSkills.find(s => s === skill.id)) {
      setSelectedSkills(prev => [...prev, skill.id]);
      setFilters(prev => ({
        ...prev,
        skills: [...prev.skills, skill.id],
      }));
    }
    setSkillsSearch("");
  };

  const handleSkillRemove = (skillId: string) => {
    setSelectedSkills(prev => prev.filter(s => s !== skillId));
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillId),
    }));
  };

  const handleApplyFilters = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleClearFilters = () => {
    const clearedFilters: FilterState = {
      priceMin: "",
      priceMax: "",
      currency: "USD",
      paymentType: "both",
      level: [],
      skills: [],
      location: "",
      availability: [],
    };
    setFilters(clearedFilters);
    setSelectedSkills([]);
    onApplyFilters(clearedFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.priceMin || filters.priceMax) count++;
    if (filters.currency !== "USD") count++;
    if (filters.paymentType !== "both") count++;
    if (filters.level.length > 0) count++;
    if (filters.skills.length > 0) count++;
    if (filters.location) count++;
    if (filters.availability.length > 0) count++;
    return count;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <SlidersHorizontal className="w-6 h-6 text-gray-600" />
              <h2 className="text-xl font-bold text-gray-900">Filters</h2>
              {getActiveFiltersCount() > 0 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Price Range */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Price Range
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      {currentCurrency.symbol}
                    </span>
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.priceMin}
                      onChange={(e) => handleFilterChange("priceMin", e.target.value)}
                      className={`pl-8 h-10 ${filters.paymentType === "hourly" ? "pr-12" : ""}`}
                      min="0"
                    />
                    {filters.paymentType === "hourly" && (
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black text-sm font-medium">
                        /hr
                      </span>
                    )}
                  </div>
                  <span className="text-gray-500">-</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      {currentCurrency.symbol}
                    </span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.priceMax}
                      onChange={(e) => handleFilterChange("priceMax", e.target.value)}
                      className={`pl-8 h-10 ${filters.paymentType === "hourly" ? "pr-12" : ""}`}
                      min="0"
                    />
                    {filters.paymentType === "hourly" && (
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black text-sm font-medium">
                        /hr
                      </span>
                    )}
                  </div>
                </div>
                
                <Select value={filters.currency} onValueChange={(value) => handleFilterChange("currency", value)}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{currency.symbol}</span>
                          <span>{currency.code}</span>
                          <span className="text-gray-500 text-sm">- {currency.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Payment Type */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Payment Type</h3>
              <div className="space-y-2">
                {[
                  { value: "fixed", label: "Pay fixed price" },
                  { value: "hourly", label: "Pay by the hours" },
                  { value: "both", label: "Both" },
                ].map((option) => (
                  <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentType"
                      value={option.value}
                      checked={filters.paymentType === option.value}
                      onChange={(e) => handleFilterChange("paymentType", e.target.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Level */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Experience Level</h3>
              <div className="space-y-2">
                {LEVELS.map((level) => (
                  <label key={level.value} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.level.includes(level.value)}
                      onChange={() => handleLevelToggle(level.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{level.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Skills</h3>
              
              {/* Selected Skills */}
              {selectedSkills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedSkills.map((skillId) => {
                    const skill = availableSkills.find(s => s.id === skillId);
                    return skill ? (
                      <Badge
                        key={skillId}
                        variant="secondary"
                        className="bg-blue-100 text-blue-800 px-3 py-1"
                      >
                        {skill.name}
                        <button
                          onClick={() => handleSkillRemove(skillId)}
                          className="ml-2 hover:text-blue-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
              
              {/* Skills Search */}
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search skills..."
                  value={skillsSearch}
                  onChange={(e) => setSkillsSearch(e.target.value)}
                  className="h-10"
                />
                {availableSkills.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto z-10">
                    {availableSkills.map((skill) => (
                      <button
                        key={skill.id}
                        onClick={() => handleSkillAdd(skill)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
                      >
                        {skill.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Location</h3>
              <Input
                type="text"
                placeholder="Enter location..."
                value={filters.location}
                onChange={(e) => handleFilterChange("location", e.target.value)}
                className="h-10"
              />
            </div>

            {/* Availability */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Availability</h3>
              <div className="space-y-2">
                {AVAILABILITY_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.availability.includes(option.value)}
                      onChange={() => handleAvailabilityToggle(option.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 space-y-3">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="flex-1"
              >
                Clear All
              </Button>
              <Button
                onClick={handleApplyFilters}
                className="flex-1 bg-black text-white hover:bg-gray-800"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
