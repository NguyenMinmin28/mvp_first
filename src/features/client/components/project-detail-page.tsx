"use client";

import { useState, useEffect, useCallback } from "react";
import { useMemo, useRef } from "react";
import { Card, CardContent } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import CandidateMetaRow from "@/features/client/components/candidate-meta-row";
import { Badge } from "@/ui/components/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/components/avatar";
import { LoadingMessage } from "@/ui/components/loading-message";
import ReviewSlideModal from "@/features/client/components/review-slide-modal";
import DeveloperReviewsModal from "@/features/client/components/developer-reviews-modal";
import PeopleGrid, { Developer as PeopleGridDeveloper } from "@/features/client/components/PeopleGrid";
import { 
  Heart,
  Briefcase,
  CheckCircle,
  Check,
  MessageCircle,
  User,
  Star,
  Eye,
  Trash2,
  Clock,
  Pause,
  Play
} from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/ui/components/tooltip";

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
  const [isLocked, setIsLocked] = useState(false);
  const freelancersRef = useRef<Freelancer[]>([]);
  const fetchAbortRef = useRef<AbortController | null>(null);

  // Header sub-section: Project title and price under main header
  const ProjectHeaderBar = () => {
    const projectTitle = project?.title || project?.name || projectData?.title || projectData?.name || "Project";
    const priceText = (() => {
      const min = projectData?.budgetMin ?? project?.budgetMin ?? project?.budget;
      const max = projectData?.budgetMax ?? project?.budgetMax;
      const currency = projectData?.currency || project?.currency || "USD";
      if (min && max) return `$${min} - $${max} ${currency}`;
      if (min) return `$${min} ${currency}`;
      return undefined;
    })();
    return (
      <div className="w-full bg-white/90 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 truncate">{projectTitle}</h1>
            {priceText && (
              <span className="text-sm lg:text-base px-3 py-1.5 rounded-xl border border-gray-300 text-gray-700 bg-white whitespace-nowrap">
                {priceText}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Handle opening developer reviews modal
  const handleReadReviews = (developerId: string, developerName: string) => {
    setSelectedDeveloperForReviews({ id: developerId, name: developerName });
    setShowDeveloperReviewsModal(true);
  };

  useEffect(() => {
    fetchFreelancers();
    return () => {
      fetchAbortRef.current?.abort();
    };
  }, [project.id]);

  // Move ticking clock to requestAnimationFrame to avoid setState storms
  useEffect(() => {
    let rafId: number | null = null;
    let last = performance.now();
    const tick = (now: number) => {
      if (now - last >= 1000) {
        setCurrentTime(new Date());
        last = now;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // Update freelancers ref when freelancers change
  useEffect(() => {
    freelancersRef.current = freelancers;
    console.log('Updating freelancersRef.current with:', freelancers.map(f => ({
      id: f.id,
      developerId: f.developerId,
      developerIdFromNested: f.developer.id,
      responseStatus: f.responseStatus,
      developerName: f.developer.user.name
    })));
  }, [freelancers]);


  const fetchFreelancers = useCallback(async () => {
    try {
      // Cancel previous request để tránh race condition
      if (fetchAbortRef.current) {
        fetchAbortRef.current.abort();
      }
      
      const controller = new AbortController();
      fetchAbortRef.current = controller;
      
      setIsLoading(true);
      
      setError(null);
      
      const response = await fetch(`/api/projects/${project.id}/assignment`, { signal: controller.signal });
      
      if (response.ok) {
        const data = await response.json();
        const candidates = data.candidates || [];
        // Only lock if project status is in_progress or completed, not just accepted
        if (data.project?.locked || ["in_progress", "completed"].includes(String(data.project?.status || ""))) {
          setIsLocked(true);
        } else {
          setIsLocked(false);
        }
        
        // Bulk favorites check
        const devIds = candidates.map((c: Freelancer) => c.developer.id);
        let favMap: Record<string, boolean> = {};
        try {
          const favRes = await fetch('/api/user/favorites/check-bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ developerIds: devIds }),
            signal: controller.signal,
          });
          if (favRes.ok) {
            const favData = await favRes.json();
            favMap = favData.map || {};
          }
        } catch (e) {
          // ignore abort or network errors
        }

        const candidatesWithFavorites = candidates.map((candidate: Freelancer) => ({
          ...candidate,
          isFavorited: !!favMap[candidate.developer.id],
        }));
        
        // Debug log to check candidate data structure
        console.log('Candidates from API:', candidatesWithFavorites.map((c: Freelancer) => ({
          id: c.id,
          developerId: c.developerId,
          developerIdFromNested: c.developer.id,
          responseStatus: c.responseStatus,
          developerName: c.developer.user.name
        })));
        
        // Check accepted candidates trước khi update state
        const acceptedCandidates = candidatesWithFavorites.filter((c: Freelancer) => c.responseStatus === "accepted");
        const hadAccepted = freelancers.some((c: Freelancer) => c.responseStatus === "accepted");
        
        console.log('Setting freelancers state with:', candidatesWithFavorites.map((c: Freelancer) => ({
          id: c.id,
          developerId: c.developerId,
          developerIdFromNested: c.developer.id,
          responseStatus: c.responseStatus,
          developerName: c.developer.user.name
        })));
        
        if (acceptedCandidates.length > 0) {
          console.log('Found accepted candidates:', acceptedCandidates.map((c: Freelancer) => ({
            name: c.developer.user.name,
            responseStatus: c.responseStatus
          })));
        }
        
        // Update state
        setFreelancers(candidatesWithFavorites);
        setProjectData(data.project);
        setLastRefreshTime(new Date());
        
        if (Array.isArray(data.skills)) {
          setProjectSkills(data.skills.map((s: any) => s.name).filter(Boolean));
        }

        // Show notification nếu có người mới accept
        if (acceptedCandidates.length > 0 && !hadAccepted) {
          acceptedCandidates.forEach((candidate: Freelancer) => {
            toast.success(`🎉 ${candidate.developer.user.name} has accepted your project!`, {
              duration: 5000,
              action: {
                label: "View Details",
                onClick: () => {
                  const element = document.getElementById(`developer-${candidate.developerId}`);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }
              }
            });
          });
        }

      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch freelancers");
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        console.log('Request aborted');
        return;
      }
      console.error("Error fetching freelancers:", error);
      setError("An error occurred while fetching freelancers");
    } finally {
      setIsLoading(false);
    }
  }, [project.id, freelancers]); // Add freelancers as dependency

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
      console.log("🔄 Starting refresh batch for project:", project.id);
      setIsLoading(true);
      setError(null);
      
      // Use refresh batch API instead of generate to preserve accepted candidates
      const refreshUrl = `/api/projects/${project.id}/batches/refresh`;
      console.log(`🔄 Calling refresh batch API: ${refreshUrl}`);
      
      const response = await fetch(refreshUrl, {
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
      
      console.log("🔄 Refresh batch API response:", response.status, response.ok);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log("🔄 Refresh batch API success:", responseData);
        // Refresh the freelancers list after refreshing batch
        await fetchFreelancers();
      } else {
        const errorData = await response.json();
        console.error("🔄 Refresh batch API error:", errorData);
        if (errorData.error?.includes("No eligible candidates")) {
          setError("All candidates have been assigned to this project");
        } else {
          setError(errorData.error || "Failed to refresh batch");
        }
      }
    } catch (error) {
      console.error("🔄 Error refreshing batch:", error);
      setError("An error occurred while refreshing batch");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to format date
  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "Date not available";
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
      return names.length ? names.join(", ") : "No skills specified";
    } catch {
      return "No skills specified";
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

  // Filter freelancers based on active filter (memoized to keep stable reference)
  const filteredFreelancers = useMemo(() => {
    const filtered = freelancers.filter(freelancer => {
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
    });
    const sorted = filtered.sort((a, b) => {
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
    return sorted;
  }, [freelancers, activeFilter, sortBy]);

  const overrideDevelopers = useMemo(() => {
    const mappedList = filteredFreelancers.map((f) => {
      const dev: any = f.developer;
      const mapped: PeopleGridDeveloper = {
        id: dev.id,
        user: {
          id: dev.user.id,
          name: dev.user.name,
          email: dev.user.email,
          image: dev.user.image || dev.photoUrl || undefined,
        },
        bio: dev.bio,
        location: dev.location,
        hourlyRateUsd: dev.hourlyRateUsd,
        ratingAvg: Number((f as any).averageRating ?? dev.ratingAvg ?? 0),
        ratingCount: Number((f as any).totalReviews ?? dev.ratingCount ?? 0),
        views: dev.views,
        likesCount: dev.likesCount,
        userLiked: dev.userLiked || (f as any).isFavorited === true,
        level: dev.level,
        skills: (dev.skills || []).map((s: any) => ({
          skill: {
            id: (s.skill.id ?? s.skill.name ?? '').toString(),
            name: s.skill.name,
          }
        })),
        services: [],
        createdAt: dev.createdAt,
      };
      return mapped;
    });
    console.log('overrideDevelopers mapped count:', mappedList.length);
    return mappedList;
  }, [filteredFreelancers]);

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
    if (freelancersRef.current.length === 0) return false;
    
    // Check if any candidate has been accepted
    return freelancersRef.current.some(freelancer => 
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

  const testCheckAccepted = async () => {
    try {
      const response = await fetch(`/api/test-check-accepted?projectId=${project.id}`);
      const data = await response.json();
      console.log('Database check result:', data);
      alert(`Database check: ${data.totalCandidates} candidates, Status counts: ${JSON.stringify(data.statusCounts)}`);
    } catch (error) {
      console.error("Error checking database:", error);
      alert("Error checking database");
    }
  };


  // Thêm manual refresh function
  const forceRefresh = async () => {
    console.log('Force refreshing...');
    console.log('Before force refresh - freelancers:', freelancers.map(f => ({
      name: f.developer.user.name,
      responseStatus: f.responseStatus
    })));
    await fetchFreelancers();
    setTimeout(() => {
      console.log('After force refresh - freelancersRef.current:', freelancersRef.current.map(f => ({
        name: f.developer.user.name,
        responseStatus: f.responseStatus
      })));
    }, 1000);
  };

  // Compute freelancerResponseStatuses outside conditional rendering
  const freelancerResponseStatuses = useMemo(() => {
    console.log('Computing freelancerResponseStatuses from freelancers:', freelancers.map(f => ({
      id: f.id,
      developerId: f.developerId,
      developerIdFromNested: f.developer.id,
      responseStatus: f.responseStatus,
      developerName: f.developer.user.name
    })));
    const statuses = freelancers.reduce((acc, freelancer) => {
      acc[freelancer.developer.id] = freelancer.responseStatus;
      return acc;
    }, {} as Record<string, string>);
    console.log('Computed freelancerResponseStatuses:', statuses);
    return statuses;
  }, [freelancers]);

  // Compute freelancerDeadlines outside conditional rendering
  const freelancerDeadlines = useMemo(() => {
    const deadlines = freelancers.reduce((acc, freelancer) => {
      acc[freelancer.developer.id] = freelancer.acceptanceDeadline;
      return acc;
    }, {} as Record<string, string>);
    console.log('Computed freelancerDeadlines:', deadlines);
    return deadlines;
  }, [freelancers]);

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-white">
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Project Name and Budget */}
        <div className="p-4 lg:p-6 pb-0">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-3xl font-bold text-black">
              {projectData?.title || project?.title || project?.name || "Project name here..."}
            </h1>
            <div className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-600">
              {(() => {
                const min = projectData?.budgetMin ?? project?.budgetMin ?? project?.budget;
                const max = projectData?.budgetMax ?? project?.budgetMax;
                const currency = projectData?.currency || project?.currency || "USD";
                if (min && max) return `$${min} - $${max}`;
                if (min) return `$${min}`;
                return "$1000 - $2000";
              })()}
            </div>
          </div>
        </div>
        
        {/* Full width separator line - outside padding container */}
        <div className="w-full" style={{ height: '2px', backgroundColor: '#BEBEBE' }}></div>
        
        <div className="p-4 lg:p-6 pt-0">
          {/* Project Description */}
          <div className="mb-6">
            <div className="px-4">
              <div className="leading-relaxed" style={{ color: '#999999', fontFamily: 'Uber Move Text, sans-serif' }}>
                {(projectData?.description || project?.description || "No description available for this project.").replace(/^Quick post:\s*/i, '')}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {hasAcceptedCandidates() && (
                <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                  <span>🔒</span>
                  <span>Project locked - someone has accepted</span>
                </div>
              )}
            </div>
          </div>

          {/* Freelancer Cards */}
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
          ) : (
                <PeopleGrid 
                  overrideDevelopers={isLoading ? [] : overrideDevelopers} 
                  freelancerResponseStatuses={freelancerResponseStatuses}
                  freelancerDeadlines={freelancerDeadlines}
                  onGenerateNewBatch={isLocked ? undefined : generateNewBatch}
                  locked={isLocked}
                  projectId={project.id}
                />
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
