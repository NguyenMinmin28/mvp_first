"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import CandidateMetaRow from "@/features/client/components/candidate-meta-row";
import { Badge } from "@/ui/components/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/components/avatar";
import { LoadingMessage } from "@/ui/components/loading-message";
import ReviewSlideModal from "@/features/client/components/review-slide-modal";
import DeveloperReviewsModal from "@/features/client/components/developer-reviews-modal";
import { 
  Send,
  Star,
  Heart,
  Briefcase,
  CheckCircle,
  Check,
  MessageCircle,
  User,
  FileText,
  Eye,
  Trash2,
  Clock
} from "lucide-react";

interface Freelancer {
  id: string;
  developerId: string;
  level: "FRESHER" | "MID" | "EXPERT";
  responseStatus: "pending" | "accepted" | "rejected" | "expired" | "invalidated";
  acceptanceDeadline: string;
  assignedAt: string;
  respondedAt?: string;
  usualResponseTimeMsSnapshot: number;
  statusTextForClient: string;
  isFavorited?: boolean;
  developer: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
    };
    level: "FRESHER" | "MID" | "EXPERT";
    photoUrl?: string;
    skills: Array<{
      skill: { name: string };
      years: number;
    }>;
  };
}

interface Project {
  id: string;
  title: string;
  description: string;
  budget: number;
  currency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectDetailPageProps {
  project: any; // Will be properly typed based on Prisma schema
}

export default function ProjectDetailPage({ project }: ProjectDetailPageProps) {
  const [activeTab, setActiveTab] = useState<"current" | "history" | "favourites">("current");
  const [activeFilter, setActiveFilter] = useState<"all" | "beginner" | "professional" | "expert">("all");
  const [sortBy, setSortBy] = useState<"relevance" | "price-asc" | "price-desc" | "response-asc" | "response-desc">("relevance");
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [projectData, setProjectData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [projectSkills, setProjectSkills] = useState<string[]>([]);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedDevelopers, setSelectedDevelopers] = useState<any[]>([]);
  const [showDeveloperReviewsModal, setShowDeveloperReviewsModal] = useState(false);
  const [selectedDeveloperForReviews, setSelectedDeveloperForReviews] = useState<{id: string, name: string} | null>(null);

  // Handle opening developer reviews modal
  const handleReadReviews = (developerId: string, developerName: string) => {
    setSelectedDeveloperForReviews({ id: developerId, name: developerName });
    setShowDeveloperReviewsModal(true);
  };

  useEffect(() => {
    fetchFreelancers();
  }, [project.id]);

  // Update current time every second for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-refresh data every 15 seconds to sync acceptance status
  // Disable auto refresh once any developer has accepted (project locked)
  useEffect(() => {
    const hasAccepted = Array.isArray(freelancers) && freelancers.some(f => f.responseStatus === "accepted");
    if (hasAccepted) {
      return; // stop creating intervals when project is locked
    }

    const refreshTimer = setInterval(() => {
      fetchFreelancers();
    }, 15000); // 15 seconds for faster sync while still finding devs

    return () => clearInterval(refreshTimer);
  }, [project.id, freelancers]);

  const fetchFreelancers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/projects/${project.id}/assignment`);
      
      if (response.ok) {
        const data = await response.json();
        const candidates = data.candidates || [];
        
        // Check favorite status for each candidate
        const candidatesWithFavorites = await Promise.all(
          candidates.map(async (candidate: Freelancer) => {
            try {
              const favoriteResponse = await fetch(`/api/user/favorites/check?developerId=${candidate.developer.id}`);
              if (favoriteResponse.ok) {
                const favoriteData = await favoriteResponse.json();
                return { ...candidate, isFavorited: favoriteData.isFavorited };
              }
            } catch (error) {
              console.error("Error checking favorite status:", error);
            }
            return { ...candidate, isFavorited: false };
          })
        );
        
        setFreelancers(candidatesWithFavorites);
        setProjectData(data.project);
        setLastRefreshTime(new Date());
        if (Array.isArray(data.skills)) {
          setProjectSkills(data.skills.map((s: any) => s.name).filter(Boolean));
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch freelancers");
      }
    } catch (error) {
      console.error("Error fetching freelancers:", error);
      setError("An error occurred while fetching freelancers");
    } finally {
      setIsLoading(false);
    }
  };

  const getSkillMatchText = (freelancer: Freelancer) => {
    try {
      const projectSkills: string[] = (projectData?.skills || projectData?.skillsRequired || [])
        .map((s: any) => (typeof s === "string" ? s : s?.skill?.name || s?.name))
        .filter(Boolean);
      const devSkills: string[] = freelancer.developer.skills.map((s) => s.skill.name);
      if (!projectSkills.length || !devSkills.length) return "N/A";
      const matched = projectSkills.filter((s) => devSkills.includes(s));
      return `${matched.length}/${projectSkills.length}`;
    } catch {
      return "N/A";
    }
  };

  const generateNewBatch = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/projects/${project.id}/batches/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fresherCount: 2,
          midCount: 2,
          expertCount: 1
        })
      });
      
      if (response.ok) {
        // Refresh the freelancers list after generating new batch
        await fetchFreelancers();
      } else {
        const errorData = await response.json();
        if (errorData.error?.includes("No eligible candidates")) {
          setError("All candidates have been assigned to this project");
        } else {
          setError(errorData.error || "Failed to generate new batch");
        }
      }
    } catch (error) {
      console.error("Error generating batch:", error);
      setError("An error occurred while generating new batch");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to format date
  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  // Helper function to get skills text from API (skill names)
  const getSkillsText = () => {
    try {
      const names = projectSkills.length
        ? projectSkills
        : (projectData?.skillsRequired || []).map((id: string) => id);
      return names.length ? names.join(", ") : "Not specified";
    } catch {
      return "Not specified";
    }
  };

  // Helper function to format countdown
  const getCountdown = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const timeLeft = deadlineDate.getTime() - currentTime.getTime();
    
    if (timeLeft <= 0) {
      return "Expired";
    }
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Helper function to get countdown color
  const getCountdownColor = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const timeLeft = deadlineDate.getTime() - currentTime.getTime();
    
    if (timeLeft <= 0) {
      return "text-red-600";
    } else if (timeLeft < 5 * 60 * 1000) { // Less than 5 minutes
      return "text-red-500";
    } else if (timeLeft < 15 * 60 * 1000) { // Less than 15 minutes
      return "text-yellow-600";
    } else {
      return "text-green-600";
    }
  };

  // Filter freelancers based on active filter
  const filteredFreelancers = freelancers.filter(freelancer => {
    if (activeFilter === "all") return true;
    
    switch (activeFilter) {
      case "beginner":
        return freelancer.developer.level === "FRESHER";
      case "professional":
        return freelancer.developer.level === "MID";
      case "expert":
        return freelancer.developer.level === "EXPERT";
      default:
        return true;
    }
  }).sort((a, b) => {
    const priceA = Number((a.developer as any).hourlyRateUsd ?? Infinity);
    const priceB = Number((b.developer as any).hourlyRateUsd ?? Infinity);
    const respA = Number(a.usualResponseTimeMsSnapshot || 0);
    const respB = Number(b.usualResponseTimeMsSnapshot || 0);
    switch (sortBy) {
      case "price-asc":
        return priceA - priceB;
      case "price-desc":
        return priceB - priceA;
      case "response-asc":
        return respA - respB;
      case "response-desc":
        return respB - respA;
      default:
        return 0;
    }
  });

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<Star key="half" className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
    }

    const remainingStars = 5 - Math.min(5, Math.ceil(rating));
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />);
    }

    return stars;
  };

  // Check if batch has accepted candidates (block immediately when someone accepts)
  const hasAcceptedCandidates = () => {
    if (freelancers.length === 0) return false;
    
    // Check if any candidate has been accepted
    return freelancers.some(freelancer => 
      freelancer.responseStatus === "accepted"
    );
  };

  // Check if batch is expired but has accepted candidates (for additional blocking)
  const isBatchExpiredWithAccepted = () => {
    if (freelancers.length === 0) return false;
    
    // Check if any candidate has expired deadline
    const hasExpiredDeadline = freelancers.some(freelancer => {
      const deadline = new Date(freelancer.acceptanceDeadline);
      return deadline.getTime() <= currentTime.getTime();
    });
    
    // Check if any candidate has been accepted
    const hasAccepted = hasAcceptedCandidates();
    
    return hasExpiredDeadline && hasAccepted;
  };

  // Handle completing project and showing review modal
  const handleToggleFavorite = async (developerId: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/user/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ developerId }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update the freelancer's favorite status in the list
        setFreelancers(prev => 
          prev.map(freelancer => 
            freelancer.developer.id === developerId 
              ? { ...freelancer, isFavorited: data.isFavorited }
              : freelancer
          )
        );
      } else {
        console.error('Failed to toggle favorite');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleCompleteProject = async () => {
    try {
      const response = await fetch(`/api/projects/${project.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.acceptedDevelopers && data.acceptedDevelopers.length > 0) {
          // Show review slide modal for all accepted developers
          setSelectedDevelopers(data.acceptedDevelopers);
          setShowReviewModal(true);
        }
        // Refresh project data
        await fetchFreelancers();
      } else {
        let errorMessage = "Failed to complete project";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          console.error("Failed to parse error response:", jsonError);
          errorMessage = `Failed to complete project (${response.status})`;
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error("Error completing project:", error);
      alert("Failed to complete project");
    }
  };

  // Handle submitting review
  const handleSubmitReview = async (reviewData: any, developerId: string) => {
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          developerId: developerId,
          rating: reviewData.rating,
          comment: reviewData.comment,
          deliveryOnTime: reviewData.deliveryOnTime,
        }),
      });

      if (response.ok) {
        // Refresh project data after each review
        await fetchFreelancers();
      } else {
        let errorMessage = "Failed to submit review";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          console.error("Failed to parse error response:", jsonError);
          errorMessage = `Failed to submit review (${response.status})`;
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      throw error;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-full lg:w-80 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 p-4 lg:p-6">
        {/* Project Details Card */}
        <div className="mb-4 lg:mb-6 border border-black rounded-md p-2">
        <Card className="border border-gray-200 rounded-md">
          <CardContent className="p-4 lg:p-6">
            <div className="space-y-3 lg:space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-300">
                <span className="font-medium text-sm lg:text-base truncate">
                  {projectData?.title || project.title || "Untitled Project"}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-300">
                <span className="font-medium text-sm lg:text-base">
                  {getSkillsText()}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-300">
                <span className="font-medium text-sm lg:text-base">
                  ${projectData?.budget || projectData?.budgetMin || 0} {projectData?.currency || "USD"}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-300">
                <span className="font-medium text-sm lg:text-base">
                  {formatDate(projectData?.expectedStartAt)}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-300">
                <span className="font-medium text-sm lg:text-base">
                  {formatDate(projectData?.expectedEndAt)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-4 lg:mb-6 border border-black rounded-md p-2">
          <div className="border border-gray-200 rounded-md p-3">
          <div className="grid grid-cols-3 gap-2 lg:space-y-2 lg:grid-cols-1">
          <Button
            variant={activeTab === "current" ? "default" : "ghost"}
            className={`justify-center ${activeTab === "current" ? "bg-black text-white" : "border border-gray-300"} h-10 lg:h-auto lg:w-full`}
            onClick={() => setActiveTab("current")}
          >
            <Send className="h-4 w-4 mr-1 lg:mr-2" />
            <span className="text-xs lg:text-sm">Current</span>
          </Button>
          <Button
            variant={activeTab === "history" ? "default" : "ghost"}
            className={`justify-center ${activeTab === "history" ? "bg-black text-white" : "border border-gray-300"} h-10 lg:h-auto lg:w-full`}
            onClick={() => setActiveTab("history")}
          >
            <FileText className="h-4 w-4 mr-1 lg:mr-2" />
            <span className="text-xs lg:text-sm">History</span>
          </Button>
          <Button
            variant={activeTab === "favourites" ? "default" : "ghost"}
            className={`justify-center ${activeTab === "favourites" ? "bg-black text-white" : "border border-gray-300"} h-10 lg:h-auto lg:w-full`}
            onClick={() => setActiveTab("favourites")}
          >
            <Star className="h-4 w-4 mr-1 lg:mr-2" />
            <span className="text-xs lg:text-sm">Favourites</span>
          </Button>
          </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button 
            className="w-full bg-gray-100 text-black hover:bg-gray-200 border border-gray-300 h-10 lg:h-auto"
            onClick={generateNewBatch}
            disabled={isLoading || hasAcceptedCandidates()}
          >
            <User className="h-4 w-4 mr-1 lg:mr-2" />
            <span className="text-xs lg:text-sm">
              {isLoading ? "Finding..." : 
               hasAcceptedCandidates() ? "Project Locked (Accepted)" : 
               "Find New Freelancers"}
            </span>
          </Button>
          
          {hasAcceptedCandidates() && projectData?.status === "in_progress" && (
            <Button 
              className="w-full bg-green-600 text-white hover:bg-green-700 h-10 lg:h-auto"
              onClick={handleCompleteProject}
            >
              <Check className="h-4 w-4 mr-1 lg:mr-2" />
              <span className="text-xs lg:text-sm">Complete Project</span>
            </Button>
          )}
          
          {!hasAcceptedCandidates() && (
            <div className="text-center text-xs text-gray-500 p-2">
              No accepted candidates yet
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 lg:p-6 overflow-auto">
        {/* Filter Buttons + Sort */}
        <div className="flex items-center gap-2 mb-4 w-full">
          <div className="flex gap-2 flex-1">
          <Button
            variant={activeFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("all")}
            className={`${activeFilter === "all" ? "bg-black text-white" : ""} flex-1`}
          >
            All
          </Button>
          <Button
            variant={activeFilter === "beginner" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("beginner")}
            className={`${activeFilter === "beginner" ? "bg-black text-white" : ""} flex-1`}
          >
            <span className="mr-1">🌱</span>
            Beginner
          </Button>
          <Button
            variant={activeFilter === "professional" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("professional")}
            className={`${activeFilter === "professional" ? "bg-black text-white" : ""} flex-1`}
          >
            <span className="mr-1">🌴</span>
            Professional
          </Button>
          <Button
            variant={activeFilter === "expert" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("expert")}
            className={`${activeFilter === "expert" ? "bg-black text-white" : ""} flex-1`}
          >
            <span className="mr-1">🌳</span>
            Expert
          </Button>
          </div>
          {/* Sort Dropdown */}
          <div className="ml-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm"
            >
              <option value="relevance">Sort by: Relevance</option>
              <option value="price-asc">Sort by: Price (Low → High)</option>
              <option value="price-desc">Sort by: Price (High → Low)</option>
              <option value="response-asc">Sort by: Response time (Fastest)</option>
              <option value="response-desc">Sort by: Response time (Slowest)</option>
            </select>
          </div>
        </div>

        {/* Auto-refresh indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Auto-refresh: {lastRefreshTime.toLocaleTimeString()}</span>
          </div>
          {hasAcceptedCandidates() && (
            <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
              <span>🔒</span>
              <span>Project locked - someone has accepted</span>
            </div>
          )}
        </div>

        {/* Freelancer Cards */}
        <div className="space-y-4">
          {isLoading ? (
            <LoadingMessage 
              title="Finding the Perfect Developers"
              message="We're searching through our network of skilled developers. Please be patient..."
              size="lg"
            />
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchFreelancers} variant="outline">
                Try Again
              </Button>
            </div>
          ) : filteredFreelancers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                {freelancers.length === 0 
                  ? "No freelancers found for this project"
                  : `No freelancers found for this project`
                }
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={fetchFreelancers} variant="outline">
                  Refresh
                </Button>
                <Button 
                  onClick={generateNewBatch} 
                  variant="default" 
                  className="bg-black text-white"
                  disabled={hasAcceptedCandidates() || isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Finding More Developers...
                    </>
                  ) : hasAcceptedCandidates() ? (
                    "Project Locked (Accepted)"
                  ) : (
                    "Find More Freelancers"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            filteredFreelancers.map((freelancer) => (
              <Card key={freelancer.id} className="p-4 lg:p-6">
                <CardContent className="p-0">
                  {/* TOP: profile summary, meta and quick actions */}
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Left Section - Profile Info */}
                    <div className="flex items-start gap-3 lg:gap-4 flex-1">
                      <div className="relative flex-shrink-0">
                        <Avatar className="w-16 h-16 lg:w-20 lg:h-20 rounded-lg">
                          <AvatarImage 
                            src={freelancer.developer.photoUrl || freelancer.developer.user.image || undefined} 
                          />
                          <AvatarFallback className="bg-gray-200 text-gray-400">
                            <User className="h-6 w-6 lg:h-8 lg:w-8" />
                          </AvatarFallback>
                        </Avatar>
                        {freelancer.developer.level === "EXPERT" && (
                          <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-1">
                            <CheckCircle className="h-3 w-3" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-base lg:text-lg font-semibold text-gray-900 truncate">
                            {freelancer.developer.user.name || "Unknown Developer"}
                          </h3>
                          {freelancer.developer.level === "EXPERT" && (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600">
                              <span className="h-4 w-4 rounded-full border border-green-600 flex items-center justify-center">
                                <Check className="h-3 w-3" />
                              </span>
                              Verified
                            </span>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`h-6 w-6 p-0 transition-all duration-150 active:scale-95 ${freelancer.isFavorited ? 'text-red-600' : ''}`}
                            onClick={() => handleToggleFavorite(freelancer.developer.id, freelancer.isFavorited || false)}
                          >
                            <Heart className={`h-4 w-4 transition-all duration-200 ${freelancer.isFavorited ? 'fill-current scale-110' : 'hover:scale-110'}`} />
                          </Button>
                        </div>
                        
                        <p className="text-gray-600 mb-2 lg:mb-3 text-sm lg:text-base">
                          {freelancer.developer.level} Level Developer
                        </p>

                        {/* Inline status under role */}
                        <div className="mb-2 lg:mb-3">
                          {freelancer.responseStatus === "pending" && (
                            <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800">
                              Pending
                            </span>
                          )}
                          {freelancer.responseStatus === "accepted" && (
                            <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-black" style={{ backgroundColor: "#7BFFD2" }}>
                              Ready to start
                            </span>
                          )}
                          {(freelancer.responseStatus === "rejected" || freelancer.responseStatus === "expired") && (
                            <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-red-100 text-red-700">
                              {freelancer.responseStatus === "expired" ? "Expired" : "Rejected"}
                            </span>
                          )}
                          {freelancer.responseStatus !== "pending" && freelancer.responseStatus !== "accepted" && freelancer.responseStatus !== "rejected" && freelancer.responseStatus !== "expired" && (
                            <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700">
                              {freelancer.responseStatus}
                            </span>
                          )}
                        </div>
                        
                        <div className="mb-2 lg:mb-3" />

                        {/* Meta row moved below the whole top block */}
                        {/* Top-right quick actions on large screens */}
                      </div>
                    </div>

                    {/* Right Section - Actions aligned with name row */}
                    <div className="flex flex-col items-start lg:items-end gap-2 lg:gap-3">
                      {/* Buttons first to align with user name row */}
                      <div className="flex flex-row gap-2 w-full lg:w-auto justify-start lg:justify-end">
                        <Button
                          className="bg-black text-white hover:bg-gray-800 text-xs lg:text-sm h-8 lg:h-9"
                          asChild
                        >
                          <a
                            href={
                              freelancer.responseStatus === "accepted" && (freelancer as any)?.developer?.whatsappNumber
                                ? `https://wa.me/${String((freelancer as any).developer.whatsappNumber).replace(/\D/g, "")}`
                                : undefined
                            }
                            target={
                              freelancer.responseStatus === "accepted" && (freelancer as any)?.developer?.whatsappNumber
                                ? "_blank"
                                : undefined
                            }
                            rel={
                              freelancer.responseStatus === "accepted" && (freelancer as any)?.developer?.whatsappNumber
                                ? "noopener noreferrer"
                                : undefined
                            }
                          >
                            <MessageCircle className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                            {freelancer.responseStatus === "accepted" && (freelancer as any)?.developer?.whatsappNumber
                              ? String((freelancer as any).developer.whatsappNumber)
                              : "WhatsApp"}
                          </a>
                        </Button>
                        <Button
                          className="bg-black text-white hover:bg-gray-800 text-xs lg:text-sm h-8 lg:h-9"
                          onClick={() => {
                            // Only allow when developer has accepted (belongs to project)
                            if (freelancer.responseStatus !== "accepted") return;
                            window.open(`/developer/${freelancer.developer.id}`, "_blank");
                          }}
                          disabled={freelancer.responseStatus !== "accepted"}
                        >
                          <User className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                          Check my Profile
                        </Button>
                      </div>

                      {/* Status under buttons */}
                      <div className="flex items-center gap-2">
                        {freelancer.responseStatus === "pending" ? (
                          <div className="flex flex-col items-end gap-1">
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">Pending</Badge>
                            {freelancer.acceptanceDeadline && (
                              <div className="text-xs text-gray-500">
                                <span className={`font-medium ${getCountdownColor(freelancer.acceptanceDeadline)}`}>
                                  {getCountdown(freelancer.acceptanceDeadline)}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : freelancer.responseStatus === "accepted" ? (
                          <Badge className="bg-green-100 text-green-800 text-xs">Accepted</Badge>
                        ) : (freelancer.responseStatus === "rejected" || freelancer.responseStatus === "expired") ? (
                          <Badge className="bg-red-100 text-red-800 text-xs">{freelancer.responseStatus === "expired" ? "Expired" : "Rejected"}</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800 text-xs capitalize">{freelancer.responseStatus}</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Meta Row positioned to align with avatar on the left */}
                  <div className="mt-4 mb-3">
                    <CandidateMetaRow
                      freelancer={freelancer as any}
                      projectData={projectData}
                      projectSkillNames={projectSkills}
                    />
                  </div>

                  {/* Divider (full-width hyphens) */}
                  <div className="my-3 w-full overflow-hidden select-none" aria-hidden>
                    <span className="block whitespace-nowrap text-gray-300 tracking-widest">
                      ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
                    </span>
                  </div>

                  {/* BOTTOM: rating and actions */}
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    {/* Rating summary */}
                    <div className="flex items-center gap-2 text-sm">
                      {(() => {
                        const rating = Number((freelancer as any).averageRating ?? 0) || 0;
                        const reviews = Number((freelancer as any).totalReviews ?? 0) || 0;
                        return (
                          <>
                            <span className="font-semibold">{rating.toFixed(1)}</span>
                            <div className="flex items-center">
                              {renderStars(rating).map((star, i) => (
                                <span key={i}>{star}</span>
                              ))}
                            </div>
                            <span className="text-gray-500">{reviews} reviews</span>
                          </>
                        );
                      })()}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs lg:text-sm h-8 lg:h-9 border-black text-black font-medium hover:bg-black hover:text-white transition-colors"
                        disabled={!((freelancer.developer as any).portfolioLinks?.length)}
                      >
                        My Latest Folio
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs lg:text-sm h-8 lg:h-9 border-black text-black font-medium hover:bg-black hover:text-white transition-colors"
                        onClick={() => handleReadReviews(freelancer.developer.id, freelancer.developer.user.name)}
                      >
                        Read Reviews
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-black border-black text-xs lg:text-sm h-8 lg:h-9 hover:bg-black hover:text-white transition-colors"
                        disabled={isBatchExpiredWithAccepted()}
                      >
                        <Trash2 className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                        {isBatchExpiredWithAccepted() ? "Locked" : "Remove"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Review Slide Modal */}
      {showReviewModal && selectedDevelopers.length > 0 && (
        <ReviewSlideModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedDevelopers([]);
          }}
          project={{
            id: project.id,
            title: projectData?.title || project.title || "Untitled Project"
          }}
          developers={selectedDevelopers}
          onSubmit={handleSubmitReview}
        />
      )}

      {/* Developer Reviews Modal */}
      {showDeveloperReviewsModal && selectedDeveloperForReviews && (
        <DeveloperReviewsModal
          isOpen={showDeveloperReviewsModal}
          onClose={() => {
            setShowDeveloperReviewsModal(false);
            setSelectedDeveloperForReviews(null);
          }}
          developerId={selectedDeveloperForReviews.id}
          developerName={selectedDeveloperForReviews.name}
        />
      )}
      
    </div>
  );
}
