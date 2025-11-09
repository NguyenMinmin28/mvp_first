"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/ui/components/button";
import { Badge } from "@/ui/components/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/components/avatar";
import { Input } from "@/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/select";
import { UserLayout } from "@/features/shared/components/user-layout";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Search,
  Filter,
  Settings,
  ChevronDown,
  Globe,
  UserPlus,
  MoreVertical,
  Star,
  MapPin,
  Heart,
  X,
} from "lucide-react";
import { GetInTouchButton } from "@/features/shared/components/get-in-touch-button";
import Link from "next/link";

interface FavoriteDeveloper {
  id: string;
  name: string;
  email: string;
  image?: string;
  photoUrl?: string;
  location?: string;
  experienceYears: number;
  hourlyRateUsd?: number;
  level: "FRESHER" | "MID" | "EXPERT";
  currentStatus: "available" | "not_available" | "online" | "offline";
  adminApprovalStatus: "draft" | "pending" | "approved" | "rejected";
  whatsappNumber?: string;
  skills: Array<{
    skillId: string;
    skillName: string;
  }>;
  averageRating: number;
  totalReviews: number;
  favoritedAt: string;
}

type TabType = "all" | "collaborators" | "referrals";
type SortOption = "relevance" | "name" | "rating" | "recent";

export default function FavoritesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [favorites, setFavorites] = useState<FavoriteDeveloper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [levelFilter, setLevelFilter] = useState<"FRESHER" | "MID" | "EXPERT" | null>(null);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("/api/user/favorites");
      
      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch favorites");
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
      setError("An error occurred while fetching favorites");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (developerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch("/api/user/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ developerId }),
      });

      if (response.ok) {
        setFavorites((prev) => prev.filter((fav) => fav.id !== developerId));
      } else {
        console.error("Failed to remove favorite");
      }
    } catch (error) {
      console.error("Error removing favorite:", error);
    }
  };

  useEffect(() => {
    // Read level from query string
    const level = searchParams.get("level");
    if (level === "FRESHER" || level === "MID" || level === "EXPERT") {
      setLevelFilter(level);
    } else {
      setLevelFilter(null);
    }
    fetchFavorites();
  }, [searchParams]);

  // Get all unique skills for tag filtering
  const allSkills = useMemo(() => {
    const skillSet = new Set<string>();
    favorites.forEach((fav) => {
      fav.skills.forEach((skill) => skillSet.add(skill.skillName));
    });
    return Array.from(skillSet).sort();
  }, [favorites]);

  // Filter and sort favorites
  const filteredAndSortedFavorites = useMemo(() => {
    let filtered = [...favorites];

    // Level filtering from URL query params
    if (levelFilter) {
      filtered = filtered.filter((fav) => fav.level === levelFilter);
    }

    // Tab filtering (for now, all tabs show the same - can be extended later)
    if (activeTab === "collaborators") {
      // Filter by developers who have worked on projects together
      // This can be extended based on project history
    } else if (activeTab === "referrals") {
      // Filter by referred developers
      // This can be extended based on referral system
    }

    // Search filtering
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (fav) =>
          fav.name.toLowerCase().includes(query) ||
          fav.email.toLowerCase().includes(query) ||
          fav.location?.toLowerCase().includes(query) ||
          fav.skills.some((skill) =>
            skill.skillName.toLowerCase().includes(query)
          )
      );
    }

    // Tag filtering
    if (selectedTags.length > 0) {
      filtered = filtered.filter((fav) =>
        selectedTags.some((tag) =>
          fav.skills.some((skill) => skill.skillName === tag)
        )
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "rating":
          return (b.averageRating || 0) - (a.averageRating || 0);
        case "recent":
          return (
            new Date(b.favoritedAt).getTime() -
            new Date(a.favoritedAt).getTime()
          );
        case "relevance":
        default:
          // Sort by rating first, then by recent
          if (b.averageRating !== a.averageRating) {
            return (b.averageRating || 0) - (a.averageRating || 0);
          }
          return (
            new Date(b.favoritedAt).getTime() -
            new Date(a.favoritedAt).getTime()
          );
      }
    });

    return filtered;
  }, [favorites, activeTab, searchQuery, sortBy, selectedTags, levelFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
      case "online":
        return "bg-green-500";
      case "not_available":
        return "bg-orange-500";
      case "offline":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "EXPERT":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "MID":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "FRESHER":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <UserLayout user={session?.user}>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          </div>
        </div>
      </UserLayout>
    );
  }

  if (error) {
    return (
      <UserLayout user={session?.user}>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchFavorites}>Try Again</Button>
        </div>
      </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout user={session?.user}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header with Tabs and Actions */}
        <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              {/* Tabs */}
              <div className="flex space-x-1 border-b border-gray-200">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "all"
                      ? "border-gray-900 text-gray-900 font-semibold"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveTab("collaborators")}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "collaborators"
                      ? "border-gray-900 text-gray-900 font-semibold"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Collaborators
                </button>
                <button
                  onClick={() => setActiveTab("referrals")}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "referrals"
                      ? "border-gray-900 text-gray-900 font-semibold"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Referrals
                </button>
                    </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                  className="h-9 w-9 p-0"
                  title="More options"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
                <Button
                  className="bg-gray-900 hover:bg-gray-800 text-white h-9 px-4"
                  size="sm"
                  onClick={() => router.push("/services?tab=people")}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Build network
                  <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 bg-white border-gray-300 focus:border-gray-900 focus:ring-gray-900 w-full"
                />
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Select
                  value="filter-placeholder"
                  onValueChange={(value) => {
                    if (value && value !== "filter-placeholder" && !selectedTags.includes(value)) {
                      setSelectedTags([...selectedTags, value]);
                    }
                  }}
                >
                  <SelectTrigger className="h-10 w-10 p-0 border-gray-300 flex-shrink-0 [&>svg:last-child]:hidden flex items-center justify-center">
                    <Filter className="h-4 w-4" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="filter-placeholder" disabled>Filter by skill</SelectItem>
                    {allSkills
                      .filter((skill) => !selectedTags.includes(skill))
                      .map((skill) => (
                        <SelectItem key={skill} value={skill}>
                          {skill}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 p-0 border-gray-300 flex-shrink-0"
                  title="Settings"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Select value="lists">
                  <SelectTrigger className="h-10 w-24 border-gray-300 flex-shrink-0">
                    <SelectValue placeholder="Lists" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lists">Lists</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sort and Contact Count */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-600">
                  {filteredAndSortedFavorites.length} contact
                  {filteredAndSortedFavorites.length !== 1 ? "s" : ""}
                </div>
                {levelFilter && (
                  <Badge
                    className={`${getLevelColor(levelFilter)} text-xs border`}
                  >
                    {levelFilter === "FRESHER" && "Starter"}
                    {levelFilter === "MID" && "Professional"}
                    {levelFilter === "EXPERT" && "Experts"}
                    <button
                      onClick={() => {
                        setLevelFilter(null);
                        router.push("/favorites");
                      }}
                      className="ml-2 hover:text-gray-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Sort:</span>
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                  <SelectTrigger className="h-8 w-32 border-gray-300 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="recent">Recent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Selected Tags */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    {tag}
                    <button
                      onClick={() =>
                        setSelectedTags((prev) => prev.filter((t) => t !== tag))
                      }
                      className="ml-2 hover:text-gray-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                    </div>
                  )}
                  </div>

          {/* Empty State */}
          {filteredAndSortedFavorites.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center mb-6">
                  <Globe className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Unlock hidden opportunities by building your network
                </h3>
                <p className="text-gray-600 mb-6 max-w-md">
                  Tap into your network to discover who's hiring and connect
                  with people you trust.
                </p>
                <Button
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                  onClick={() => router.push("/services?tab=people")}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Build network
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          ) : (
            /* Table View */
            <div className="bg-white rounded-lg border border-gray-200 shadow-lg overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Table Header */}
                <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 py-3">
                  <div className="grid grid-cols-[40px_1fr_140px_180px_160px_200px] gap-4 items-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    <div>
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                      />
                    </div>
                    <div>Name</div>
                    <div>Connection</div>
                    <div>
                      Tags
                      <ChevronDown className="h-3 w-3 inline ml-1" />
                    </div>
                    <div>
                      Location
                      <span className="ml-1 text-gray-400">ℹ</span>
                      <ChevronDown className="h-3 w-3 inline ml-1" />
                    </div>
                    <div>Source</div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-200">
                  {filteredAndSortedFavorites.map((developer) => (
                    <div
                      key={developer.id}
                      className="px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                      onClick={() => router.push(`/developer/${developer.id}`)}
                    >
                      <div className="grid grid-cols-[40px_1fr_140px_180px_160px_200px] gap-4 items-center">
                        {/* Checkbox */}
                        <div>
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>

                        {/* Name with Image */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="relative flex-shrink-0">
                              <Avatar className="h-10 w-10">
                                <AvatarImage
                                  src={developer.photoUrl || developer.image}
                                />
                                <AvatarFallback className="bg-gray-200 text-gray-600">
                                  {developer.name?.slice(0, 2).toUpperCase() ||
                                    "DEV"}
                                </AvatarFallback>
                              </Avatar>
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(
                                  developer.currentStatus
                                )}`}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">
                                {developer.name}
                              </div>
                              <div className="text-sm text-gray-500 truncate">
                                {developer.email}
                              </div>
                            </div>
                          </div>
                  </div>

                        {/* Connection */}
                        <div className="flex-shrink-0">
                          <div className="flex flex-col gap-1">
                            <Badge
                              className={`${getLevelColor(
                                developer.level
                              )} text-xs border w-fit`}
                            >
                              {developer.level}
                            </Badge>
                            {developer.averageRating > 0 && (
                              <div className="flex items-center gap-1 text-sm whitespace-nowrap">
                                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                                <span className="text-gray-700 font-medium">
                                  {developer.averageRating.toFixed(1)}
                                </span>
                                <span className="text-gray-500 text-xs">
                                  ({developer.totalReviews})
                                </span>
                  </div>
                )}
                          </div>
                        </div>

                        {/* Tags (Skills) */}
                        <div className="min-w-0">
                    <div className="flex flex-wrap gap-1">
                            {developer.skills.slice(0, 2).map((skill) => (
                              <Badge
                                key={skill.skillId}
                                variant="secondary"
                                className="text-xs bg-gray-100 text-gray-700 border-gray-200 whitespace-nowrap"
                              >
                          {skill.skillName}
                        </Badge>
                      ))}
                            {developer.skills.length > 2 && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-gray-100 text-gray-700 border-gray-200 whitespace-nowrap"
                              >
                                +{developer.skills.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>

                        {/* Location */}
                        <div className="min-w-0">
                          {developer.location ? (
                            <div className="flex items-center gap-1 text-sm text-gray-700">
                              <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                              <span className="truncate">{developer.location}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </div>

                        {/* Source & Actions */}
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-sm text-gray-600 hidden lg:inline">
                              Favorites
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                              onClick={(e) =>
                                handleRemoveFavorite(developer.id, e)
                              }
                              title="Remove from favorites"
                            >
                              <Heart className="h-4 w-4 fill-current" />
                    </Button>
                            <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
                              <GetInTouchButton
                                developerId={developer.id}
                                developerName={developer.name}
                                className="h-8 px-3 text-xs border border-gray-300 bg-white hover:bg-gray-900 hover:text-white hover:border-gray-900 text-gray-900 shadow-sm hover:shadow-md transition-all whitespace-nowrap"
                                size="sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  );
}
