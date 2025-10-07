"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Badge } from "@/ui/components/badge";
import { Input } from "@/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/components/tabs";
import {
  FileText,
  Eye,
  MessageSquare,
  Search,
  Filter,
  Plus,
  Calendar,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreHorizontal,
  Sparkles,
  TrendingUp,
  Zap,
  Star,
  ArrowRight,
  Activity,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { ProjectReviewModal } from "./project-review-modal";
import { MessageDetailModal } from "./message-detail-modal";

interface Project {
  id: string;
  name: string;
  status:
    | "draft"
    | "submitted"
    | "assigning"
    | "accepted"
    | "in_progress"
    | "completed"
    | "canceled";
  date: string;
  budget?: number;
  currency?: string;
  skills?: string[];
  description?: string;
  candidatesCount?: number;
}

export default function MyProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("all");

  // Read initial tab from sessionStorage on mount
  useEffect(() => {
    // Only access sessionStorage on client side
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("myProjectsInitialTab");
        if (
          stored === "active" ||
          stored === "completed" ||
          stored === "draft" ||
          stored === "all"
        ) {
          setActiveTab(stored);
          sessionStorage.removeItem("myProjectsInitialTab");
        }
      } catch {}
    }
  }, []);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(8);
  const [completingProjects, setCompletingProjects] = useState<Set<string>>(
    new Set()
  );
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState<{
    projectId: string;
    projectTitle: string;
    developers: Array<{ id: string; name: string; image?: string }>;
  } | null>(null);
  const [reviewedProjects, setReviewedProjects] = useState<Set<string>>(
    new Set()
  );
  const [manualInvitations, setManualInvitations] = useState<Record<string, any[]>>({});
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchManualInvitations();
  }, []);

  const fetchManualInvitations = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      const response = await fetch(`/api/projects/manual-invitations?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const invitationsMap: Record<string, any[]> = {};
          data.data.forEach((item: any) => {
            invitationsMap[item.projectId] = item.invitations;
          });
          setManualInvitations(invitationsMap);
        }
      }
    } catch (error) {
      console.error("Error fetching manual invitations:", error);
    }
  };

  // Check review status for all completed projects
  useEffect(() => {
    const checkReviewStatus = async () => {
      const completedProjects = projects.filter(
        (p) => p.status === "completed"
      );
      const reviewStatusPromises = completedProjects.map(async (project) => {
        try {
          const response = await fetch(
            `/api/projects/${project.id}/reviews/status`
          );
          if (response.ok) {
            const data = await response.json();
            return { projectId: project.id, hasReviews: data.hasReviews };
          }
        } catch (error) {
          console.error(
            `Error checking review status for project ${project.id}:`,
            error
          );
        }
        return { projectId: project.id, hasReviews: false };
      });

      const results = await Promise.all(reviewStatusPromises);
      const reviewedSet = new Set(
        results.filter((r) => r.hasReviews).map((r) => r.projectId)
      );
      setReviewedProjects(reviewedSet);
    };

    if (projects.length > 0) {
      checkReviewStatus();
    }
  }, [projects]);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteProject = async (projectId: string) => {
    try {
      setCompletingProjects((prev) => new Set(prev).add(projectId));

      const response = await fetch(`/api/projects/${projectId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        // If there are developers to review, show review modal
        if (data.acceptedDevelopers && data.acceptedDevelopers.length > 0) {
          setReviewData({
            projectId,
            projectTitle: data.project.title,
            developers: data.acceptedDevelopers,
          });
          setShowReviewModal(true);
        } else {
          toast.success("Project marked as completed successfully!");
          await fetchProjects();
        }
      } else {
        let errorMessage = "Failed to complete project";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          console.error("Failed to parse error response:", jsonError);
          errorMessage = `Failed to complete project (${response.status})`;
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error completing project:", error);
      toast.error("An error occurred while completing the project");
    } finally {
      setCompletingProjects((prev) => {
        const newSet = new Set(prev);
        newSet.delete(projectId);
        return newSet;
      });
    }
  };

  const handleReviewComplete = async () => {
    await fetchProjects();
    setShowReviewModal(false);
    setReviewData(null);

    // Mark project as reviewed
    if (reviewData) {
      setReviewedProjects((prev) => new Set(prev).add(reviewData.projectId));
    }
  };

  const handleReviewProject = async (
    projectId: string,
    projectTitle: string
  ) => {
    try {
      // First check if project already has reviews
      const reviewCheckResponse = await fetch(
        `/api/projects/${projectId}/reviews/status`
      );

      if (reviewCheckResponse.ok) {
        const reviewStatus = await reviewCheckResponse.json();
        if (reviewStatus.hasReviews) {
          toast.info("This project has already been reviewed");
          return;
        }
      }

      // Fetch accepted developers for this project
      const response = await fetch(`/api/projects/${projectId}/assignment`);

      if (response.ok) {
        const data = await response.json();
        const acceptedDevelopers =
          data.candidates
            ?.filter(
              (candidate: any) => candidate.responseStatus === "accepted"
            )
            ?.map((candidate: any) => ({
              id: candidate.developer.id,
              name: candidate.developer.user.name,
              image:
                candidate.developer.photoUrl || candidate.developer.user.image,
            })) || [];

        if (acceptedDevelopers.length > 0) {
          setReviewData({
            projectId,
            projectTitle,
            developers: acceptedDevelopers,
          });
          setShowReviewModal(true);
        } else {
          toast.info("No accepted developers to review for this project");
        }
      } else {
        toast.error("Failed to fetch project data");
      }
    } catch (error) {
      console.error("Error fetching project data for review:", error);
      toast.error("An error occurred while fetching project data");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-gradient-to-r from-gray-900 to-black text-white border-2 border-gray-900 shadow-lg";
      case "in_progress":
        return "bg-white text-gray-900 border-2 border-gray-900 shadow-md font-black";
      case "accepted":
        return "bg-white text-gray-900 border-2 border-gray-400 shadow-md font-bold";
      case "submitted":
        return "bg-white text-gray-700 border-2 border-gray-300 shadow-sm font-semibold";
      case "assigning":
        return "bg-gray-100 text-gray-900 border-2 border-gray-400 shadow-sm font-semibold";
      case "draft":
        return "bg-gray-50 text-gray-600 border-2 border-gray-200 font-medium";
      case "canceled":
        return "bg-white text-red-600 border-2 border-red-600 shadow-sm font-bold";
      default:
        return "bg-gray-50 text-gray-600 border-2 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "in_progress":
        return <Clock className="h-4 w-4" />;
      case "accepted":
        return <Users className="h-4 w-4" />;
      case "submitted":
        return <AlertCircle className="h-4 w-4" />;
      case "assigning":
        return <Clock className="h-4 w-4" />;
      case "draft":
        return <FileText className="h-4 w-4" />;
      case "canceled":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "in_progress":
        return "In Progress";
      case "accepted":
        return "Accepted";
      case "submitted":
        return "Submitted";
      case "assigning":
        return "Assigning";
      case "draft":
        return "Draft";
      case "canceled":
        return "Canceled";
      default:
        return status;
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || project.status === statusFilter;
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" &&
        ["submitted", "assigning", "accepted", "in_progress"].includes(
          project.status
        )) ||
      (activeTab === "completed" && project.status === "completed") ||
      (activeTab === "draft" && project.status === "draft") ||
      (activeTab === "messages"); // Don't show projects in messages tab

    return matchesSearch && matchesStatus && matchesTab;
  });

  const [quotaStatus, setQuotaStatus] = useState<{
    hasActiveSubscription: boolean;
    isHighestTier?: boolean;
    packageName?: string;
    quotas?: { projectsPerMonth: number; contactClicksPerProject: number };
    usage?: { projectsUsed: number; contactClicksUsed: Record<string, number> };
    remaining?: { projects: number; contactClicks: Record<string, number> };
  } | null>(null);

  useEffect(() => {
    const fetchQuota = async () => {
      try {
        const res = await fetch("/api/billing/quotas", {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        setQuotaStatus(data);
      } catch (error) {
        console.error("Failed to fetch quota status:", error);
      }
    };
    fetchQuota();
  }, []);

  // Reset page on filters/search/tab changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, activeTab]);

  // Get all manual invitations as separate items
  const getAllManualInvitations = () => {
    const allInvitations: any[] = [];
    Object.entries(manualInvitations).forEach(([projectId, invitations]) => {
      const project = projects.find(p => p.id === projectId);
      const computedProjectTitle = project
        ? project.name
        : (projectId === 'direct' ? 'Direct Messages' : 'Messages');
      invitations.forEach((invitation: any) => {
        allInvitations.push({
          ...invitation,
          projectTitle: computedProjectTitle,
          projectId,
          client: {
            name: invitation.client?.name || 'Client',
            companyName: invitation.client?.companyName || null,
          },
        });
      });
    });
    return allInvitations;
  };

  const allManualInvitations = getAllManualInvitations();

  const handleViewMessageDetail = (invitation: any) => {
    setSelectedMessage(invitation);
    setShowMessageModal(true);
  };

  const handleCloseMessageModal = () => {
    setShowMessageModal(false);
    setSelectedMessage(null);
  };
  
  // Filter manual invitations based on search term
  const filteredManualInvitations = allManualInvitations.filter((invitation) => {
    const matchesSearch = 
      invitation.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invitation.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invitation.budget?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invitation.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalItems = activeTab === "messages" 
    ? filteredManualInvitations.length 
    : filteredProjects.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIdx = (page - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  
  const visibleProjects = activeTab === "messages" 
    ? [] 
    : filteredProjects.slice(startIdx, endIdx);
  const visibleManualInvitations = activeTab === "messages" 
    ? filteredManualInvitations.slice(startIdx, endIdx)
    : [];

  const getTabCount = (tab: string) => {
    switch (tab) {
      case "all":
        return projects.length;
      case "active":
        return projects.filter((p) =>
          ["submitted", "assigning", "accepted", "in_progress"].includes(
            p.status
          )
        ).length;
      case "completed":
        return projects.filter((p) => p.status === "completed").length;
      case "draft":
        return projects.filter((p) => p.status === "draft").length;
      case "messages":
        return allManualInvitations.length;
      default:
        return 0;
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case "accepted": return "✅";
      case "rejected": return "❌";
      case "pending": return "⏳";
      case "expired": return "⏰";
      default: return "📧";
    }
  };

  const renderManualInvitationCard = (invitation: any, projectTitle: string) => (
    <div
      key={`invitation-${invitation.id}`}
      className="group relative animate-fade-in-up"
    >
      {/* Elegant shadow */}
      <div className="absolute inset-0 bg-black rounded-2xl blur-2xl opacity-5 group-hover:opacity-10 transition-opacity duration-500" />
      
      <Card className="relative overflow-hidden border-2 border-gray-200 bg-white hover:border-black hover:bg-gray-50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.01] rounded-2xl">
        {/* Subtle shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/[0.02] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        
        <CardContent className="relative p-5 lg:p-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* Avatar/Icon section */}
            <div className="flex items-start gap-4 flex-1">
              {/* Elegant Icon */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-black rounded-xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
                <div className="relative w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-gray-900 to-black rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-xl border border-gray-800">
                  <MessageSquare className="h-7 w-7 lg:h-8 lg:w-8 text-white" />
                </div>
                {/* Status indicator */}
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full border-2 border-gray-900 shadow-lg flex items-center justify-center text-xs font-bold">
                  {getStatusEmoji(invitation.responseStatus)}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-3">
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex items-start gap-3 flex-wrap">
                    <h3 className="text-base lg:text-lg font-black text-gray-900 group-hover:text-black transition-all duration-300">
                      {invitation.developer?.name || invitation.developer?.user?.name || "Developer"}
                    </h3>
                    <Badge
                      className={`text-xs lg:text-sm font-black border-2 shadow-md transition-all duration-300 ${
                        invitation.responseStatus === "accepted" 
                          ? "bg-white text-green-600 border-green-600" :
                        invitation.responseStatus === "rejected" 
                          ? "bg-white text-red-600 border-red-600" :
                        invitation.responseStatus === "pending" 
                          ? "bg-white text-orange-600 border-orange-600 animate-pulse" :
                        invitation.responseStatus === "expired"
                          ? "bg-white text-gray-600 border-gray-600"
                          : "bg-white text-black border-black"
                      }`}
                    >
                      {invitation.responseStatus === "accepted" ? "✓ Accepted" :
                       invitation.responseStatus === "rejected" ? "✗ Rejected" :
                       invitation.responseStatus === "pending" ? "⌛ Pending" :
                       invitation.responseStatus === "expired" ? "⏰ Expired" :
                       invitation.responseStatus}
                    </Badge>
                  </div>
                  
                  {/* Project info */}
                  <div className="flex items-center gap-2 text-sm lg:text-base">
                    <div className="w-6 h-6 bg-gradient-to-br from-gray-900 to-black rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-gray-600 font-semibold">Project:</span>
                    <span className="font-black text-gray-900 truncate">{projectTitle}</span>
                  </div>
                </div>

                {/* Message preview */}
                {invitation.clientMessage && (
                  <div className="relative pl-4 border-l-4 border-black">
                    <p className="text-sm lg:text-base text-gray-700 italic line-clamp-2 leading-relaxed font-medium">
                      "{invitation.clientMessage}"
                    </p>
                  </div>
                )}

                {/* Meta info */}
                <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 rounded-lg shadow-sm border border-gray-200 hover:border-gray-900 transition-colors duration-200">
                    <Calendar className="h-3.5 w-3.5 text-gray-900" />
                    <span className="text-xs lg:text-sm font-bold text-gray-900">
                      {new Date(invitation.assignedAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  {invitation.budget && (
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-black text-white rounded-lg shadow-md">
                      <DollarSign className="h-3.5 w-3.5" />
                      <span className="text-xs lg:text-sm font-black">
                        {invitation.budget}
                      </span>
                    </div>
                  )}
                  {invitation.description && (
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 rounded-lg shadow-sm border border-gray-200">
                      <Sparkles className="h-3.5 w-3.5 text-gray-900" />
                      <span className="text-xs lg:text-sm text-gray-900 font-semibold truncate max-w-[150px]">
                        {invitation.description}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action button */}
            <div className="flex items-start lg:items-center">
              <Button
                size="sm"
                className="relative w-full lg:w-auto bg-black hover:bg-gray-900 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group/btn overflow-hidden rounded-lg px-6 py-5"
                onClick={() => handleViewMessageDetail(invitation)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                <Eye className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform duration-300 relative z-10" />
                <span className="relative z-10 font-bold">View Details</span>
                <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform duration-300 relative z-10" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 lg:px-6 py-4 lg:py-8 space-y-6 lg:space-y-8 relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Elegant Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLW9wYWNpdHk9IjAuMDIiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] pointer-events-none opacity-60" />
      
      {/* Elegant Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 lg:gap-6 animate-fade-in-up relative z-10">
        <div className="flex items-center gap-4 group">
          {/* Minimalist Icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-black rounded-2xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
            <div className="relative w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-gray-900 via-black to-gray-800 rounded-2xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-2xl border border-gray-800">
              <FileText className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
              <div className="absolute -top-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center text-black text-xs font-black shadow-xl border-2 border-gray-900">
                {projects.length}
              </div>
            </div>
          </div>
          
          <div>
            <h1 className="text-3xl lg:text-5xl font-black text-gray-900 hover:text-black transition-all duration-300 cursor-pointer tracking-tight">
              My Projects
            </h1>
            <p className="text-sm lg:text-base text-gray-600 mt-2 flex items-center gap-2 font-medium">
              <div className="relative flex items-center">
                <Activity className="w-4 h-4 text-gray-900" />
                <div className="absolute inset-0 w-4 h-4 bg-gray-900 rounded-full blur-sm opacity-20 animate-ping" />
              </div>
              <span>Manage and track all your projects in one place</span>
            </p>
          </div>
        </div>
        
        <Link href="/client-dashboard">
          <Button className="group relative flex items-center gap-3 w-full sm:w-auto bg-black hover:bg-gray-900 text-white border-0 px-6 py-6 lg:px-8 lg:py-7 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-black/50 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300 relative z-10" />
            <span className="text-sm lg:text-base font-bold relative z-10">Create New Project</span>
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300 relative z-10" />
          </Button>
        </Link>
      </div>

      {/* Quota Status */}
      {quotaStatus && !quotaStatus.isHighestTier && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Project Quota Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {quotaStatus.hasActiveSubscription ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Projects this month:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {quotaStatus.usage?.projectsUsed || 0} /{" "}
                      {quotaStatus.quotas?.projectsPerMonth || 0}
                    </span>
                    <Badge
                      variant={
                        quotaStatus.remaining?.projects === 0
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {quotaStatus.remaining?.projects || 0} remaining
                    </Badge>
                  </div>
                </div>
                {quotaStatus.remaining?.projects === 0 && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-700">
                      Monthly project limit reached. Upgrade your plan to create
                      more projects.
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-700">
                  No active subscription. Please subscribe to create projects.
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Cards - Elegant Black & White */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 relative z-10">
        <div className="animate-fade-in-up group" style={{ animationDelay: '100ms' }}>
          <div className="relative">
            <div className="absolute inset-0 bg-black rounded-2xl blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-500" />
            
            <Card className="relative border-2 border-gray-200 bg-white hover:bg-gray-50 rounded-2xl shadow-lg hover:shadow-2xl hover:border-black transition-all duration-500 transform hover:-translate-y-1 hover:scale-[1.02] cursor-pointer overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              
              <CardContent className="p-5 lg:p-6 relative z-10">
                <div className="flex items-center gap-3 lg:gap-4">
                  <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-gray-900 to-black rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 flex-shrink-0 shadow-lg">
                    <FileText className="h-6 w-6 lg:h-7 lg:w-7 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs lg:text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">
                      Total Projects
                    </p>
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900">
                      {projects.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="animate-fade-in-up group" style={{ animationDelay: '200ms' }}>
          <div className="relative">
            <div className="absolute inset-0 bg-black rounded-2xl blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-500" />
            
            <Card className="relative border-2 border-gray-200 bg-white hover:bg-gray-50 rounded-2xl shadow-lg hover:shadow-2xl hover:border-black transition-all duration-500 transform hover:-translate-y-1 hover:scale-[1.02] cursor-pointer overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              
              <CardContent className="p-5 lg:p-6 relative z-10">
                <div className="flex items-center gap-3 lg:gap-4">
                  <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-gray-900 to-black rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 flex-shrink-0 shadow-lg">
                    <CheckCircle className="h-6 w-6 lg:h-7 lg:w-7 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs lg:text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Completed</p>
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900">
                      {projects.filter((p) => p.status === "completed").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="animate-fade-in-up group" style={{ animationDelay: '300ms' }}>
          <div className="relative">
            <div className="absolute inset-0 bg-black rounded-2xl blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-500" />
            
            <Card className="relative border-2 border-gray-200 bg-white hover:bg-gray-50 rounded-2xl shadow-lg hover:shadow-2xl hover:border-black transition-all duration-500 transform hover:-translate-y-1 hover:scale-[1.02] cursor-pointer overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              
              <CardContent className="p-5 lg:p-6 relative z-10">
                <div className="flex items-center gap-3 lg:gap-4">
                  <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-gray-900 to-black rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 flex-shrink-0 shadow-lg">
                    <Clock className="h-6 w-6 lg:h-7 lg:w-7 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs lg:text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">In Progress</p>
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900">
                      {
                        projects.filter((p) =>
                          [
                            "submitted",
                            "assigning",
                            "accepted",
                            "in_progress",
                          ].includes(p.status)
                        ).length
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="animate-fade-in-up group" style={{ animationDelay: '400ms' }}>
          <div className="relative">
            <div className="absolute inset-0 bg-black rounded-2xl blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-500" />
            
            <Card className="relative border-2 border-gray-200 bg-white hover:bg-gray-50 rounded-2xl shadow-lg hover:shadow-2xl hover:border-black transition-all duration-500 transform hover:-translate-y-1 hover:scale-[1.02] cursor-pointer overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              
              <CardContent className="p-5 lg:p-6 relative z-10">
                <div className="flex items-center gap-3 lg:gap-4">
                  <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-gray-900 to-black rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 flex-shrink-0 shadow-lg">
                    <DollarSign className="h-6 w-6 lg:h-7 lg:w-7 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs lg:text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Total Budget</p>
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 truncate">
                      {(() => {
                        const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
                        if (totalBudget >= 1000000000) {
                          return `$${(totalBudget / 1000000000).toFixed(1)}B`;
                        } else if (totalBudget >= 1000000) {
                          return `$${(totalBudget / 1000000).toFixed(1)}M`;
                        } else if (totalBudget >= 1000) {
                          return `$${(totalBudget / 1000).toFixed(1)}K`;
                        } else {
                          return `$${totalBudget.toLocaleString()}`;
                        }
                      })()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Filters and Search - Elegant Design */}
      <div className="animate-fade-in-up relative z-10" style={{ animationDelay: '500ms' }}>
        <Card className="border-2 border-gray-200 bg-white hover:border-gray-900 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/[0.02] to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          
          <CardContent className="p-6 lg:p-8 relative">
            <div className="flex flex-col gap-4 lg:gap-5">
              {/* Search bar - with enhanced effects */}
              <div className="w-full">
                <div className="relative group/search">
                  {/* Animated icon */}
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 transition-all duration-300">
                    <Search className="h-5 w-5 text-gray-400 group-focus-within/search:text-black group-focus-within/search:scale-110 transition-all duration-300" />
                  </div>
                  
                  {/* Enhanced input */}
                  <Input
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-12 py-6 text-sm lg:text-base border-2 border-gray-200 focus:border-black hover:border-gray-400 rounded-xl transition-all duration-300 bg-white focus:bg-gray-50 font-medium placeholder:text-gray-400 shadow-sm focus:shadow-lg"
                  />
                  
                  {/* Search indicator */}
                  {searchTerm && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
                      <button
                        onClick={() => setSearchTerm("")}
                        className="text-gray-400 hover:text-black transition-colors duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                  
                  {/* Focus ring animation */}
                  <div className="absolute inset-0 rounded-xl border-2 border-black opacity-0 group-focus-within/search:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              </div>
            
            {/* Mobile native selects */}
            <div className="sm:hidden space-y-3">
              <div>
                <label className="sr-only">Status Filter</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="assigning">Assigning</option>
                  <option value="accepted">Accepted</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="canceled">Canceled</option>
                </select>
              </div>
              
              <div>
                <label className="sr-only">Page Size</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150"
                  value={String(pageSize)}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                >
                  <option value="6">6 / page</option>
                  <option value="8">8 / page</option>
                  <option value="12">12 / page</option>
                  <option value="16">16 / page</option>
                </select>
              </div>
            </div>

            {/* Desktop/tablet shadcn selects */}
            <div className="hidden sm:block">
              <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full text-sm lg:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent
                    className="z-50 max-h-[200px] overflow-y-auto
                               w-[var(--radix-select-trigger-width)]
                               max-w-[calc(100vw-24px)]"
                    sideOffset={4}
                    avoidCollisions
                    collisionPadding={8}
                  >
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="assigning">Assigning</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Page size */}
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => setPageSize(Number(v))}
                >
                  <SelectTrigger className="w-full text-sm lg:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150">
                    <SelectValue placeholder="Page size" />
                  </SelectTrigger>
                  <SelectContent
                    className="z-50 max-h-[200px] overflow-y-auto
                               w-[var(--radix-select-trigger-width)]
                               max-w-[calc(100vw-24px)]"
                    sideOffset={4}
                    avoidCollisions
                    collisionPadding={8}
                  >
                    <SelectItem value="6">6 / page</SelectItem>
                    <SelectItem value="8">8 / page</SelectItem>
                    <SelectItem value="12">12 / page</SelectItem>
                    <SelectItem value="16">16 / page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Tabs - Elegant Design */}
      <div className="animate-fade-in-up relative z-10" style={{ animationDelay: '600ms' }}>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-5 lg:space-y-6"
        >
          <TabsList className="w-full bg-white border-2 border-gray-200 gap-2 
                               overflow-x-auto scrollbar-none 
                               flex sm:grid sm:grid-cols-3 lg:grid-cols-5 min-w-0
                               h-auto p-2 rounded-xl shadow-lg">
          <TabsTrigger
            value="all"
            className="relative px-4 py-3 text-xs sm:text-sm font-bold whitespace-nowrap 
                       data-[state=active]:bg-gradient-to-br data-[state=active]:from-gray-900 data-[state=active]:to-black
                       data-[state=active]:text-white data-[state=active]:shadow-xl
                       hover:bg-gray-100
                       transition-all duration-300 flex-shrink-0 rounded-lg
                       min-w-fit group overflow-hidden border-2 border-transparent
                       data-[state=active]:border-gray-900"
          >
            {/* Shine effect on active */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-data-[state=active]:translate-x-[100%] transition-transform duration-1000" />
            
            <span className="relative z-10 flex items-center gap-2">
              <FileText className="w-4 h-4 group-data-[state=active]:scale-110 transition-transform duration-300" />
              <span className="hidden sm:inline">All ({getTabCount("all")})</span>
              <span className="sm:hidden">All</span>
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="active"
            className="relative px-4 py-3 text-xs sm:text-sm font-bold whitespace-nowrap 
                       data-[state=active]:bg-gradient-to-br data-[state=active]:from-gray-900 data-[state=active]:to-black
                       data-[state=active]:text-white data-[state=active]:shadow-xl
                       hover:bg-gray-100
                       transition-all duration-300 flex-shrink-0 rounded-lg
                       min-w-fit group overflow-hidden border-2 border-transparent
                       data-[state=active]:border-gray-900"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-data-[state=active]:translate-x-[100%] transition-transform duration-1000" />
            <span className="relative z-10 flex items-center gap-2">
              <Activity className="w-4 h-4 group-data-[state=active]:scale-110 transition-transform duration-300" />
              <span className="hidden sm:inline">Active ({getTabCount("active")})</span>
              <span className="sm:hidden">Active</span>
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="relative px-4 py-3 text-xs sm:text-sm font-bold whitespace-nowrap 
                       data-[state=active]:bg-gradient-to-br data-[state=active]:from-gray-900 data-[state=active]:to-black
                       data-[state=active]:text-white data-[state=active]:shadow-xl
                       hover:bg-gray-100
                       transition-all duration-300 flex-shrink-0 rounded-lg
                       min-w-fit group overflow-hidden border-2 border-transparent
                       data-[state=active]:border-gray-900"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-data-[state=active]:translate-x-[100%] transition-transform duration-1000" />
            <span className="relative z-10 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 group-data-[state=active]:scale-110 transition-transform duration-300" />
              <span className="hidden sm:inline">Completed ({getTabCount("completed")})</span>
              <span className="sm:hidden">Done</span>
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="draft"
            className="relative px-4 py-3 text-xs sm:text-sm font-bold whitespace-nowrap 
                       data-[state=active]:bg-gradient-to-br data-[state=active]:from-gray-900 data-[state=active]:to-black
                       data-[state=active]:text-white data-[state=active]:shadow-xl
                       hover:bg-gray-100
                       transition-all duration-300 flex-shrink-0 rounded-lg
                       min-w-fit group overflow-hidden border-2 border-transparent
                       data-[state=active]:border-gray-900"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-data-[state=active]:translate-x-[100%] transition-transform duration-1000" />
            <span className="relative z-10 flex items-center gap-2">
              <FileText className="w-4 h-4 group-data-[state=active]:scale-110 transition-transform duration-300" />
              <span className="hidden sm:inline">Draft ({getTabCount("draft")})</span>
              <span className="sm:hidden">Draft</span>
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="messages"
            className="relative px-4 py-3 text-xs sm:text-sm font-bold whitespace-nowrap 
                       data-[state=active]:bg-gradient-to-br data-[state=active]:from-gray-900 data-[state=active]:to-black
                       data-[state=active]:text-white data-[state=active]:shadow-xl
                       hover:bg-gray-100
                       transition-all duration-300 flex-shrink-0 rounded-lg
                       min-w-fit group overflow-hidden border-2 border-transparent
                       data-[state=active]:border-gray-900"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-data-[state=active]:translate-x-[100%] transition-transform duration-1000" />
            <span className="relative z-10 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 group-data-[state=active]:scale-110 transition-transform duration-300" />
              <span className="hidden sm:inline">Messages ({getTabCount("messages")})</span>
              <span className="sm:hidden">Chat</span>
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-3 lg:space-y-4">
          {totalItems === 0 ? (
            <div className="relative group">
              <div className="absolute inset-0 bg-black rounded-2xl blur-3xl opacity-5" />
              
              <Card className="relative border-2 border-gray-200 bg-white hover:border-gray-900 rounded-2xl shadow-xl overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLW9wYWNpdHk9IjAuMDMiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-60" />
                
                <CardContent className="relative p-12 lg:p-16 text-center">
                  {/* Elegant icon */}
                  <div className="relative inline-block mb-8">
                    <div className="absolute inset-0 bg-black rounded-full blur-2xl opacity-10 animate-pulse" />
                    <div className="relative w-24 h-24 lg:w-32 lg:h-32 bg-gradient-to-br from-gray-900 to-black rounded-2xl flex items-center justify-center shadow-2xl border-2 border-gray-800 animate-float">
                      {activeTab === "messages" ? (
                        <MessageSquare className="h-12 w-12 lg:h-16 lg:w-16 text-white" />
                      ) : (
                        <FileText className="h-12 w-12 lg:h-16 lg:w-16 text-white" />
                      )}
                    </div>
                  </div>
                  
                  <h3 className="text-2xl lg:text-4xl font-black text-gray-900 mb-4">
                    {activeTab === "messages" ? "No messages found" : "No projects found"}
                  </h3>
                  
                  <p className="text-base lg:text-lg text-gray-600 mb-8 max-w-md mx-auto leading-relaxed font-medium">
                    {searchTerm || statusFilter !== "all"
                      ? "Try adjusting your search or filters to find what you're looking for"
                      : activeTab === "messages" 
                        ? "Start connecting with talented developers by sending your first message"
                        : "Begin your journey by creating your first amazing project"}
                  </p>
                  
                  {!searchTerm && statusFilter === "all" && activeTab !== "messages" && (
                    <Link href="/client-dashboard">
                      <Button className="relative bg-black hover:bg-gray-900 text-white border-0 px-8 py-6 rounded-xl text-base font-bold shadow-2xl hover:shadow-black/50 transform hover:scale-105 transition-all duration-300 overflow-hidden group/btn">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                        <Plus className="h-5 w-5 mr-2 relative z-10" />
                        <span className="relative z-10">Create Your First Project</span>
                        <ArrowRight className="h-5 w-5 ml-2 relative z-10 group-hover/btn:translate-x-1 transition-transform duration-300" />
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid gap-3 lg:gap-4 mobile-no-overflow">
              {/* Render manual invitations for messages tab */}
              {activeTab === "messages" && visibleManualInvitations.map((invitation) => (
                renderManualInvitationCard(invitation, invitation.projectTitle)
              ))}
              
              {/* Render projects */}
              {visibleProjects.map((project, index) => (
                <div 
                  key={project.id}
                  className="animate-fade-in-up group/card" 
                  style={{ animationDelay: `${700 + index * 100}ms` }}
                >
                  <div className="relative">
                    {/* Elegant shadow */}
                    <div className="absolute inset-0 bg-black rounded-2xl blur-2xl opacity-5 group-hover/card:opacity-10 transition-opacity duration-500" />
                    
                    <Card className="relative hover:shadow-2xl hover:scale-[1.01] transition-all duration-500 border-2 border-gray-200 hover:border-black mobile-no-overflow overflow-hidden bg-white hover:bg-gray-50 rounded-2xl">
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/[0.02] to-transparent -translate-x-full group-hover/card:translate-x-full transition-transform duration-1000" />
                      
                      <CardContent className="p-4 sm:p-5 lg:p-6 mobile-overflow-safe relative z-10">
                        <div className="flex flex-col gap-4 sm:gap-5 mobile-overflow-safe">
                          {/* Header: Icon, Title, Status */}
                          <div className="flex items-start gap-3 sm:gap-4">
                            {/* Elegant Icon */}
                            <div className="relative flex-shrink-0">
                              <div className="absolute inset-0 bg-black rounded-xl blur-lg opacity-10 group-hover/card:opacity-20 transition-opacity duration-300" />
                              <div className="relative w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-gray-900 to-black rounded-xl flex items-center justify-center group-hover/card:scale-110 group-hover/card:rotate-3 transition-all duration-300 shadow-lg border border-gray-800">
                                <FileText className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" />
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0 mobile-overflow-safe space-y-2">
                              <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 mobile-overflow-safe">
                                <h3 className="text-base sm:text-lg lg:text-xl font-black text-gray-900 mobile-text-truncate min-w-0 flex-1 group-hover/card:text-black transition-colors duration-300">
                                  {project.name}
                                </h3>
                                <Badge
                                  className={`${getStatusColor(project.status)} text-xs lg:text-sm w-fit flex-shrink-0 rounded-lg px-3 py-1.5 uppercase tracking-wide transition-all duration-300 group-hover/card:scale-105`}
                                >
                                  <div className="flex items-center gap-1.5">
                                    {getStatusIcon(project.status)}
                                    <span className="hidden sm:inline font-bold">
                                      {getStatusText(project.status)}
                                    </span>
                                  </div>
                                </Badge>
                              </div>

                              {project.description && (
                                <p className="text-sm lg:text-base text-gray-600 line-clamp-2 font-medium">
                                  {project.description}
                                </p>
                              )}

                              {/* Meta info pills */}
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 rounded-lg shadow-sm border border-gray-200 hover:border-gray-900 transition-colors duration-200">
                                  <Calendar className="h-3.5 w-3.5 text-gray-900" />
                                  <span className="text-xs lg:text-sm font-bold text-gray-900">{project.date}</span>
                                </div>
                                {project.budget && (
                                  <div className="flex items-center gap-1.5 px-3 py-2 bg-black text-white rounded-lg shadow-md">
                                    <DollarSign className="h-3.5 w-3.5" />
                                    <span className="text-xs lg:text-sm font-black">
                                      {(() => {
                                        const budget = project.budget;
                                        if (budget >= 1000000000) {
                                          return `$${(budget / 1000000000).toFixed(1)}B`;
                                        } else if (budget >= 1000000) {
                                          return `$${(budget / 1000000).toFixed(1)}M`;
                                        } else if (budget >= 1000) {
                                          return `$${(budget / 1000).toFixed(1)}K`;
                                        } else {
                                          return `$${budget.toLocaleString()}`;
                                        }
                                      })()}
                                    </span>
                                  </div>
                                )}
                                {project.candidatesCount !== undefined && (
                                  <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 rounded-lg shadow-sm border border-gray-200">
                                    <Users className="h-3.5 w-3.5 text-gray-900" />
                                    <span className="text-xs lg:text-sm font-semibold text-gray-900">
                                      {project.candidatesCount} {project.candidatesCount === 1 ? 'candidate' : 'candidates'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons - Enhanced Design */}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-2 border-t border-gray-100">
                            {/* View button */}
                            <Link href={`/projects/${project.id}`} className="flex-1 min-w-[120px]">
                              <Button
                                size="sm"
                                className="relative w-full bg-black hover:bg-gray-900 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 group/btn overflow-hidden rounded-lg py-5 font-bold"
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                                <Eye className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform duration-300 relative z-10" />
                                <span className="truncate relative z-10">View Details</span>
                                <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform duration-300 relative z-10" />
                              </Button>
                            </Link>
                            
                            {/* Action button (Complete/Review) */}
                            {project.status === "completed" && (
                              <Button
                                size="sm"
                                className={`flex-1 min-w-[120px] relative overflow-hidden rounded-lg py-5 font-bold transition-all duration-300 ${
                                  reviewedProjects.has(project.id)
                                    ? "bg-gray-100 text-gray-500 border-2 border-gray-200 cursor-not-allowed"
                                    : "bg-white text-gray-900 border-2 border-gray-900 hover:bg-gray-900 hover:text-white shadow-lg hover:shadow-xl"
                                }`}
                                onClick={() =>
                                  handleReviewProject(project.id, project.name)
                                }
                                disabled={reviewedProjects.has(project.id)}
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                <span className="truncate">
                                  {reviewedProjects.has(project.id) ? "Reviewed" : "Review"}
                                </span>
                                {!reviewedProjects.has(project.id) && (
                                  <Star className="h-4 w-4 ml-2" />
                                )}
                              </Button>
                            )}
                            {project.status !== "completed" &&
                              project.status !== "draft" &&
                              project.status !== "canceled" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleCompleteProject(project.id)}
                                  disabled={completingProjects.has(project.id)}
                                  className="flex-1 min-w-[120px] bg-white text-gray-900 border-2 border-gray-900 hover:bg-gray-900 hover:text-white rounded-lg py-5 font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                                >
                                  {completingProjects.has(project.id) ? (
                                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                  )}
                                  <span className="truncate">
                                    {completingProjects.has(project.id)
                                      ? "Completing..."
                                      : "Mark Complete"}
                                  </span>
                                </Button>
                              )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      </div>

      {/* Pagination Controls */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium">{startIdx + 1}</span> –{" "}
            <span className="font-medium">
              {Math.min(endIdx, totalItems)}
            </span>{" "}
            of <span className="font-medium">{totalItems}</span>{" "}
            items
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(1)}
              disabled={page === 1}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Prev
            </Button>
            <span className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
            >
              Last
            </Button>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewData && (
        <ProjectReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setReviewData(null);
          }}
          projectId={reviewData.projectId}
          projectTitle={reviewData.projectTitle}
          developers={reviewData.developers}
          onComplete={handleReviewComplete}
        />
      )}

      {/* Message Detail Modal */}
      <MessageDetailModal
        isOpen={showMessageModal}
        onClose={handleCloseMessageModal}
        message={selectedMessage}
      />
    </div>
  );
}
