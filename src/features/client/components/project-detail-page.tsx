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
  const isSearchingRef = useRef(false);
  const [isSearching, setIsSearching] = useState(false);
  const pollingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingAttemptsRef = useRef<number>(0);
  const autoGenerateBatchAttemptedRef = useRef<boolean>(false); // Track if we've tried to auto-generate batch
  const searchStartTimeRef = useRef<number | null>(null); // Track when search started for 30-second timeout
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // 30-second timeout

  const formatAmount = (amount: number, currency: string) => {
    try {
      const locale = currency === "VND" ? "vi-VN" : "en-US";
      return new Intl.NumberFormat(locale, { style: "currency", currency }).format(Number(amount));
    } catch {
      return `${currency} ${Number(amount).toLocaleString()}`;
    }
  };

  // Header sub-section: Project title and price under main header
  const ProjectHeaderBar = () => {
    const projectTitle = project?.title || project?.name || projectData?.title || projectData?.name || "Project";
    const priceText = (() => {
      const min = projectData?.budgetMin ?? project?.budgetMin ?? project?.budget;
      const max = projectData?.budgetMax ?? project?.budgetMax;
      const currency = projectData?.currency || project?.currency || "USD";
      if (min && max) return `${formatAmount(min, currency)} - ${formatAmount(max, currency)}`;
      if (min) return `${formatAmount(min, currency)}`;
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
    // Reset polling counter when project changes
    pollingAttemptsRef.current = 0;
    isSearchingRef.current = false;
    setIsSearching(false);
    autoGenerateBatchAttemptedRef.current = false; // Reset auto-generate flag when project changes
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    // Clear 30-second timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    searchStartTimeRef.current = null;
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
      
      // Chỉ set isLoading = true khi chưa có candidates nào (lần đầu load)
      if (freelancersRef.current.length === 0) {
        setIsLoading(true);
      }
      
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
        const hadAccepted = freelancersRef.current.some((c: Freelancer) => c.responseStatus === "accepted");
        
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
        
        // INCREMENTAL UPDATE: Detect và append chỉ các developer mới
        const currentDeveloperIds = new Set(freelancersRef.current.map((f: Freelancer) => f.developer.id));
        const newCandidates = candidatesWithFavorites.filter((c: Freelancer) => 
          !currentDeveloperIds.has(c.developer.id)
        );
        
        // Update existing candidates với data mới nhất (để sync status changes)
        const updatedExisting = freelancersRef.current.map((existing: Freelancer) => {
          const updated = candidatesWithFavorites.find((c: Freelancer) => c.developer.id === existing.developer.id);
          return updated || existing;
        });
        
        // Merge: existing (updated) + new candidates
        const mergedCandidates = [...updatedExisting, ...newCandidates];
        
        // Log new developers found
        if (newCandidates.length > 0) {
          console.log(`✨ Found ${newCandidates.length} new developer(s):`, 
            newCandidates.map((c: Freelancer) => c.developer.user.name));
        }
        
        // Update state với merged list
        setFreelancers(mergedCandidates);
        setProjectData(data.project);
        setLastRefreshTime(new Date());
        
        // Tắt loading ngay khi có ít nhất 1 candidate
        if (mergedCandidates.length > 0) {
          setIsLoading(false);
          // Clear timeout if candidates found
          if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = null;
          }
          searchStartTimeRef.current = null;
        }
        
        if (Array.isArray(data.skills)) {
          setProjectSkills(data.skills.map((s: any) => s.name).filter(Boolean));
        }

        // Show notification nếu có người mới accept (before polling check)
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

        // Check if project needs initial batch generation
        const hasBatch = !!data.project?.currentBatchId;
        const stillSearching = !!data.searching && hasBatch; // Only search if batch exists and API says it's searching
        const hasNoCandidates = candidatesWithFavorites.length === 0;
        const needsInitialBatch = !hasBatch && hasNoCandidates && !autoGenerateBatchAttemptedRef.current && !isLocked;
        
        // Auto-generate first batch if project doesn't have one yet
        // Use refresh API instead of generate API - it uses optimized logic and will auto-generate if no batch exists
        if (needsInitialBatch) {
          console.log('🔄 Project has no batch yet, using refresh API (same optimized logic as refresh batch)...');
          autoGenerateBatchAttemptedRef.current = true;
          isSearchingRef.current = true;
          setIsSearching(true);
          
          // Start 30-second timeout timer for auto-generation
          searchStartTimeRef.current = Date.now();
          if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
          }
          searchTimeoutRef.current = setTimeout(() => {
            // Check if still searching and no candidates found after 30 seconds
            if (isSearchingRef.current && freelancersRef.current.length === 0) {
              console.log('⏱️ 30-second timeout reached during auto-generation, showing timeout message');
              isSearchingRef.current = false;
              setIsSearching(false);
              setError("Sorry, we couldn't find the right match with your project. Please try adjusting your project requirements or contact support.");
              // Stop polling
              if (pollingTimeoutRef.current) {
                clearTimeout(pollingTimeoutRef.current);
                pollingTimeoutRef.current = null;
              }
              pollingAttemptsRef.current = 30; // Prevent further polling
            }
            searchTimeoutRef.current = null;
          }, 30000); // 30 seconds
          
          // Use refresh API - it will automatically generate new batch if no batch exists
          // This uses the same optimized/fast logic as refresh batch, not the slower generate logic
          (async () => {
            try {
              const refreshResponse = await fetch(`/api/projects/${project.id}/batches/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  fresherCount: 2,
                  midCount: 2,
                  expertCount: 1
                }),
                signal: controller.signal,
              });
              
              if (refreshResponse.ok) {
                console.log('✅ Batch generated via refresh API successfully, starting fast polling...');
                // Reset polling counter since we're starting fresh
                pollingAttemptsRef.current = 0;
                // Start fast polling immediately (500ms interval) - same as refresh batch
                isSearchingRef.current = true;
                setIsSearching(true);
                if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
                pollingTimeoutRef.current = setTimeout(() => {
                  pollingAttemptsRef.current += 1;
                  fetchFreelancers();
                }, 500); // Fast polling: 500ms - same as refresh batch
              } else {
                console.error('❌ Failed to generate batch via refresh API');
                autoGenerateBatchAttemptedRef.current = false; // Allow retry
                isSearchingRef.current = false;
                setIsSearching(false);
              }
            } catch (error: any) {
              if (error?.name !== 'AbortError') {
                console.error('❌ Error generating batch via refresh API:', error);
                autoGenerateBatchAttemptedRef.current = false; // Allow retry
                isSearchingRef.current = false;
                setIsSearching(false);
              }
            }
          })();
          return; // Exit early, will fetch again after batch is generated
        }
        
        // If we have a batch now (after auto-generation), start fast polling if needed
        if (hasBatch && hasNoCandidates) {
          // Check if batch might still be processing - poll với interval ngắn hơn
          if (pollingAttemptsRef.current < 30) {
            isSearchingRef.current = true;
            setIsSearching(true);
            if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
            // Fast polling: 600ms khi đang search, chậm dần sau mỗi 5 lần
            const pollInterval = pollingAttemptsRef.current < 20 ? 600 : 1000;
            pollingTimeoutRef.current = setTimeout(() => {
              pollingAttemptsRef.current += 1;
              fetchFreelancers();
            }, pollInterval);
            return;
          }
        }
        
        // Nếu có candidates mới, tiếp tục polling với interval ngắn để tìm thêm
        if (hasBatch && newCandidates.length > 0 && pollingAttemptsRef.current < 30) {
          // Có developer mới xuất hiện, tiếp tục polling nhanh để tìm thêm
          isSearchingRef.current = true;
          setIsSearching(true);
          if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
          pollingTimeoutRef.current = setTimeout(() => {
            pollingAttemptsRef.current += 1;
            fetchFreelancers();
          }, 600); // Fast polling khi có developer mới
          return;
        }
        
        // Stop polling if we've reached max attempts
        if (pollingAttemptsRef.current >= 30) {
          isSearchingRef.current = false;
          setIsSearching(false);
          if (pollingTimeoutRef.current) {
            clearTimeout(pollingTimeoutRef.current);
            pollingTimeoutRef.current = null;
          }
          if (hasNoCandidates && stillSearching) {
            console.log('Polling stopped: reached max attempts (30)');
            setError("Search is taking longer than expected. Please refresh the page or try generating a new batch.");
          }
          // Don't reset counter here - keep it at 30 to prevent more polling
        } else if (hasNoCandidates && stillSearching) {
          // Only poll if we have a batch and API says it's still searching
          isSearchingRef.current = true;
          setIsSearching(true);
          if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
          // Fast polling khi đang search nhưng chưa có candidates
          const pollInterval = pollingAttemptsRef.current < 20 ? 600 : 1000;
          pollingTimeoutRef.current = setTimeout(() => {
            pollingAttemptsRef.current += 1;
            fetchFreelancers();
          }, pollInterval);
        } else {
          // Search completed, candidates found - stop polling
          isSearchingRef.current = false;
          setIsSearching(false);
          pollingAttemptsRef.current = 0;
          if (pollingTimeoutRef.current) {
            clearTimeout(pollingTimeoutRef.current);
            pollingTimeoutRef.current = null;
          }
          // Clear 30-second timeout
          if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = null;
          }
          searchStartTimeRef.current = null;
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
      // Chỉ tắt loading khi đã có candidates hoặc không còn polling
      if (freelancersRef.current.length > 0 || pollingAttemptsRef.current >= 30) {
        setIsLoading(false);
      }
    }
  }, [project.id]); // Only depend on project.id to prevent infinite loops

  // Effect to fetch freelancers after component mounts or project.id changes
  // Placed after fetchFreelancers definition to avoid hoisting issues
  useEffect(() => {
    fetchFreelancers();
    return () => {
      fetchAbortRef.current?.abort();
      if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
    };
  }, [project.id, fetchFreelancers]); // Include fetchFreelancers since it's stable via useCallback

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
      console.log("🔄 Starting NEW batch generation for project:", project.id);
      
      // Check if project has accepted candidates BEFORE clearing
      const hasAccepted = freelancersRef.current.some((f: Freelancer) => f.responseStatus === "accepted");
      
      // Clear existing freelancers list để hiển thị batch mới
      setFreelancers([]);
      freelancersRef.current = [];
      
      // Set loading state ngay lập tức để hiển thị loading message
      setIsLoading(true);
      
      // Set searching state để hiển thị indicator
      isSearchingRef.current = true;
      setIsSearching(true);
      setError(null);
      
      // Start 30-second timeout timer
      searchStartTimeRef.current = Date.now();
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        // Check if still searching and no candidates found after 30 seconds
        if (isSearchingRef.current && freelancersRef.current.length === 0) {
          console.log('⏱️ 30-second timeout reached, showing timeout message');
          isSearchingRef.current = false;
          setIsSearching(false);
          setError("Sorry, we couldn't find the right match with your project. Please try adjusting your project requirements or contact support.");
          // Stop polling
          if (pollingTimeoutRef.current) {
            clearTimeout(pollingTimeoutRef.current);
            pollingTimeoutRef.current = null;
          }
          pollingAttemptsRef.current = 30; // Prevent further polling
        }
        searchTimeoutRef.current = null;
      }, 30000); // 30 seconds
      
      let apiUrl: string;
      
      if (hasAccepted) {
        // Có accepted candidates, dùng refresh để preserve
        apiUrl = `/api/projects/${project.id}/batches/refresh`;
        console.log("🔄 Has accepted candidates, using refresh API");
      } else {
        // Không có accepted, generate batch mới hoàn toàn
        apiUrl = `/api/projects/${project.id}/batches/generate`;
        console.log("🔄 No accepted candidates, generating completely new batch");
      }
      
      const response = await fetch(apiUrl, {
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
      
      console.log("🔄 Batch API response:", response.status, response.ok);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log("🔄 Batch API success:", responseData);
        
        // Reset polling counter và start fast polling để hiển thị candidates ngay
        pollingAttemptsRef.current = 0;
        autoGenerateBatchAttemptedRef.current = false; // Reset flag để có thể auto-generate lại nếu cần
        
        // Start fast polling immediately để fetch candidates mới - không delay
        fetchFreelancers();
      } else {
        const errorData = await response.json();
        console.error("🔄 Batch API error:", errorData);
        isSearchingRef.current = false;
        setIsSearching(false);
        setIsLoading(false);
        
        if (errorData.error?.includes("No eligible candidates")) {
          setError("All candidates have been assigned to this project");
        } else if (errorData.error?.includes("exhausted available developers")) {
          setError("This project has exhausted all available developers. Please try manual assignment or contact support.");
        } else if (errorData.error?.includes("already has accepted candidates")) {
          // Nếu không thể generate vì có accepted, thử refresh
          console.log("🔄 Cannot generate new batch, trying refresh instead...");
          const refreshResponse = await fetch(`/api/projects/${project.id}/batches/refresh`, {
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
          
          if (refreshResponse.ok) {
            pollingAttemptsRef.current = 0;
            fetchFreelancers();
          } else {
            setError(errorData.error || "Failed to generate new batch");
          }
        } else {
          setError(errorData.error || "Failed to generate new batch");
        }
      }
    } catch (error) {
      console.error("🔄 Error generating new batch:", error);
      isSearchingRef.current = false;
      setIsSearching(false);
      setIsLoading(false);
      setError("An error occurred while generating new batch");
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
        currentStatus: dev.currentStatus,
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
    console.log('📊 FREELANCERS DATA:', {
      count: freelancers.length,
      freelancers: freelancers.map(f => ({
        id: f.id,
        developerId: f.developerId,
        developerIdFromNested: f.developer.id,
        responseStatus: f.responseStatus,
        developerName: f.developer.user.name,
        acceptanceDeadline: f.acceptanceDeadline,
        assignedAt: f.assignedAt
      }))
    });
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
    const FALLBACK_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

    const deriveDateFromObjectId = (id?: string): Date | null => {
      try {
        if (!id) return null;
        const hex = String(id);
        if (hex.length < 8) return null;
        const seconds = parseInt(hex.substring(0, 8), 16);
        if (Number.isNaN(seconds)) return null;
        return new Date(seconds * 1000);
      } catch {
        return null;
      }
    };

    console.log('🕐 Computing deadlines for freelancers:', freelancers.map(f => ({
      name: f.developer.user.name,
      developerId: f.developer.id,
      candidateId: f.id,
      responseStatus: f.responseStatus,
      acceptanceDeadline: f.acceptanceDeadline,
      assignedAt: f.assignedAt
    })));
    
    const deadlines = freelancers.reduce((acc, freelancer) => {
      try {
        if (freelancer.responseStatus !== "pending") {
          return acc;
        }

        // 1) acceptanceDeadline from API
        const explicitDeadline = freelancer.acceptanceDeadline ? new Date(freelancer.acceptanceDeadline as any) : null;
        if (explicitDeadline && Number.isFinite(explicitDeadline.getTime())) {
          acc[freelancer.developer.id] = explicitDeadline.toISOString();
          return acc;
        }

        // 2) assignedAt + 15m from API
        const assignedAtFromApi = freelancer.assignedAt ? new Date(freelancer.assignedAt as any) : null;
        if (assignedAtFromApi && Number.isFinite(assignedAtFromApi.getTime())) {
          acc[freelancer.developer.id] = new Date(assignedAtFromApi.getTime() + FALLBACK_WINDOW_MS).toISOString();
          return acc;
        }

        // 3) Fallback: derive assignedAt from Mongo ObjectId of candidate.id, then +15m
        const derivedAssigned = deriveDateFromObjectId(freelancer.id);
        if (derivedAssigned) {
          acc[freelancer.developer.id] = new Date(derivedAssigned.getTime() + FALLBACK_WINDOW_MS).toISOString();
          return acc;
        }

        // If all failed, skip this developer
      } catch (error) {
        console.error(`❌ Error computing deadline for developer ${freelancer.developer.user.name}:`, error);
      }
      return acc;
    }, {} as Record<string, string>);
    console.log('🎯 Final computed freelancerDeadlines:', deadlines);
    return deadlines;
  }, [freelancers]);

  console.log('🚀 PROJECT DETAIL PAGE RENDER - freelancers:', {
    count: freelancers.length,
    freelancerDeadlines,
    freelancerResponseStatuses,
    rawFreelancersData: freelancers.map(f => ({
      name: f.developer.user.name,
      developerId: f.developer.id,
      responseStatus: f.responseStatus,
      acceptanceDeadline: f.acceptanceDeadline,
      assignedAt: f.assignedAt
    }))
  });

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-white">
      {/* Main Content */}
      <div className="flex-1 w-full">
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
                if (min && max) return `${formatAmount(min, currency)} - ${formatAmount(max, currency)}`;
                if (min) return `${formatAmount(min, currency)}`;
                return `${formatAmount(1000, currency)} - ${formatAmount(2000, currency)}`;
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

          {/* Project Skills */}
          <div className="mb-6">
            <div className="px-4">
              <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Skills required</div>
              <div className="flex flex-wrap gap-2">
                {projectSkills && projectSkills.length > 0 ? (
                  projectSkills.map((name) => (
                    <Badge key={name} variant="secondary" className="bg-gray-100 text-gray-700 border border-gray-200">
                      {name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">{getSkillsText()}</span>
                )}
              </div>
            </div>
          </div>

       

          {/* Freelancer Cards */}
          {/* Chỉ hiển thị loading screen khi THỰC SỰ chưa có candidate nào và đang load lần đầu */}
          {isLoading && freelancers.length === 0 && !error ? (
            <LoadingMessage 
              title="Finding the Perfect Developers"
              message="AI matchmaking in progress — bringing you the smartest connections."
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
            <>
              {/* Hiển thị ngay khi có ít nhất 1 candidate */}
              <PeopleGrid 
                overrideDevelopers={overrideDevelopers} 
                freelancerResponseStatuses={freelancerResponseStatuses}
                freelancerDeadlines={freelancerDeadlines}
                onGenerateNewBatch={isLocked ? undefined : generateNewBatch}
                locked={isLocked}
                projectId={project.id}
              />
              {/* Indicator nhỏ khi đang search thêm candidates */}
              {isSearching && freelancers.length > 0 && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                  <span>Searching for more developers...</span>
                </div>
              )}
            </>
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
