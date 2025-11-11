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
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/ui/components/dropdown-menu";
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
  const router = useRouter();
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
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

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
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "accepted":
        return "bg-purple-100 text-purple-800";
      case "submitted":
        return "bg-yellow-100 text-yellow-800";
      case "assigning":
        return "bg-orange-100 text-orange-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "canceled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
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
      case "draft":
        return "Draft";
      case "submitted":
        return "Pending Review";
      case "assigning":
        return "Searching Developers";
      case "accepted":
        return "Developer Assigned";
      case "in_progress":
        return "Work in Progress";
      case "completed":
        return "Completed";
      case "canceled":
        return "Cancelled";
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

  const renderManualInvitationCard = (invitation: any, projectTitle: string) => (
    <Card
      key={`invitation-${invitation.id}`}
      className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border border-blue-200 hover:border-blue-300 bg-blue-50"
    >
      <CardContent className="p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 lg:gap-4">
          <div className="flex items-start gap-3 lg:gap-4 flex-1">
            <div className="flex items-center justify-center flex-shrink-0">
              <MessageSquare className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 lg:gap-3 mb-2">
                <h3 className="text-base lg:text-lg font-semibold text-blue-900 truncate">
                  {invitation.title || `Message to ${invitation.developer.name || "Developer"}`}
                </h3>
                <Badge
                  className={`text-xs lg:text-sm ${
                    invitation.responseStatus === "accepted" ? "bg-green-100 text-green-800" :
                    invitation.responseStatus === "rejected" ? "bg-red-100 text-red-800" :
                    invitation.responseStatus === "pending" ? "bg-yellow-100 text-yellow-800" :
                    "bg-gray-100 text-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {invitation.responseStatus === "accepted" ? "✅" :
                     invitation.responseStatus === "rejected" ? "❌" :
                     invitation.responseStatus === "pending" ? "⏳" : ""}
                    <span className="hidden sm:inline">
                      {invitation.responseStatus === "accepted" ? "Accepted" :
                       invitation.responseStatus === "rejected" ? "Rejected" :
                       invitation.responseStatus === "pending" ? "Pending" :
                       invitation.responseStatus}
                    </span>
                  </div>
                </Badge>
              </div>

              <div className="text-sm lg:text-base text-blue-700 mb-2 lg:mb-3">
                <strong>Project:</strong> {projectTitle}
              </div>

              {invitation.clientMessage && (
                <p className="text-sm lg:text-base text-blue-600 mb-2 lg:mb-3 italic">
                  "{invitation.clientMessage}"
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2 lg:gap-4 text-xs lg:text-sm text-blue-500">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 lg:h-4 lg:w-4" />
                  {new Date(invitation.assignedAt).toLocaleDateString()}
                </div>
                {invitation.budget && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 lg:h-4 lg:w-4" />
                    Budget: {invitation.budget}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1 lg:gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
              onClick={() => handleViewMessageDetail(invitation)}
            >
              <MessageSquare className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 lg:px-6 py-4 lg:py-8 space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 lg:gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            My Projects
          </h1>
          <p className="text-sm lg:text-base text-gray-600 mt-1">
            Manage and track all your projects
          </p>
        </div>
        <Link href="/client-dashboard">
          <Button className="flex items-center gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            <span className="text-sm lg:text-base">New Project</span>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Card>
          <CardContent className="p-3 lg:p-4">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="p-1.5 lg:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <FileText className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs lg:text-sm text-gray-600">
                  Total Projects
                </p>
                <p className="text-sm sm:text-lg lg:text-2xl font-bold">
                  {projects.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 lg:p-4">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="p-1.5 lg:p-2 bg-green-100 rounded-lg flex-shrink-0">
                <CheckCircle className="h-4 w-4 lg:h-5 lg:w-5 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs lg:text-sm text-gray-600">Completed</p>
                <p className="text-sm sm:text-lg lg:text-2xl font-bold">
                  {projects.filter((p) => p.status === "completed").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 lg:p-4">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="p-1.5 lg:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <Clock className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs lg:text-sm text-gray-600">In Progress</p>
                <p className="text-sm sm:text-lg lg:text-2xl font-bold">
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

        <Card>
          <CardContent className="p-3 lg:p-4">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="p-1.5 lg:p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                <DollarSign className="h-4 w-4 lg:h-5 lg:w-5 text-yellow-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs lg:text-sm text-gray-600">Total Budget</p>
                <p className="text-sm sm:text-lg lg:text-2xl font-bold truncate">
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

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4 lg:p-6">
          <div className="flex flex-col gap-3 lg:gap-4">
            {/* Search bar - full width */}
            <div className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm lg:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150"
                />
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

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4 lg:space-y-6"
      >
        <TabsList className="w-full bg-gray-100 gap-1 
                             overflow-x-auto scrollbar-none 
                             flex sm:grid sm:grid-cols-3 lg:grid-cols-5 min-w-0
                             h-auto p-1">
          <TabsTrigger
            value="all"
            className="px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm whitespace-nowrap 
                       data-[state=active]:bg-white data-[state=active]:shadow-sm 
                       transition-all duration-150 flex-shrink-0 rounded-sm
                       min-w-fit"
          >
            <span className="hidden sm:inline">All ({getTabCount("all")})</span>
            <span className="sm:hidden">All</span>
          </TabsTrigger>
          <TabsTrigger
            value="active"
            className="px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm whitespace-nowrap 
                       data-[state=active]:bg-white data-[state=active]:shadow-sm 
                       transition-all duration-150 flex-shrink-0 rounded-sm
                       min-w-fit"
          >
            <span className="hidden sm:inline">Active ({getTabCount("active")})</span>
            <span className="sm:hidden">Active</span>
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm whitespace-nowrap 
                       data-[state=active]:bg-white data-[state=active]:shadow-sm 
                       transition-all duration-150 flex-shrink-0 rounded-sm
                       min-w-fit"
          >
            <span className="hidden sm:inline">Completed ({getTabCount("completed")})</span>
            <span className="sm:hidden">Done</span>
          </TabsTrigger>
          <TabsTrigger
            value="draft"
            className="px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm whitespace-nowrap 
                       data-[state=active]:bg-white data-[state=active]:shadow-sm 
                       transition-all duration-150 flex-shrink-0 rounded-sm
                       min-w-fit"
          >
            <span className="hidden sm:inline">Draft ({getTabCount("draft")})</span>
            <span className="sm:hidden">Draft</span>
          </TabsTrigger>
          <TabsTrigger
            value="messages"
            className="px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm whitespace-nowrap 
                       data-[state=active]:bg-white data-[state=active]:shadow-sm 
                       transition-all duration-150 flex-shrink-0 rounded-sm
                       min-w-fit"
          >
            <span className="hidden sm:inline">Messages ({getTabCount("messages")})</span>
            <span className="sm:hidden">Chat</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-3 lg:space-y-4">
          {totalItems === 0 ? (
            <Card>
              <CardContent className="p-6 lg:p-8 text-center">
                <FileText className="h-8 w-8 lg:h-12 lg:w-12 text-gray-400 mx-auto mb-3 lg:mb-4" />
                <h3 className="text-base lg:text-lg font-medium text-gray-900  mb-2">
                  {activeTab === "messages" ? "No messages found" : "No projects found"}
                </h3>
                <p className="text-sm lg:text-base text-gray-500  mb-3 lg:mb-4">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : activeTab === "messages" 
                      ? "You haven't sent any messages to developers yet"
                      : "Get started by creating your first project"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 lg:gap-4 mobile-no-overflow">
              {/* Render manual invitations for messages tab */}
              {activeTab === "messages" && visibleManualInvitations.map((invitation) => (
                renderManualInvitationCard(invitation, invitation.projectTitle)
              ))}
              
              {/* Render projects */}
              {visibleProjects.map((project) => (
                <Card
                  key={project.id}
                  className="hover:shadow-lg hover:scale-[1.01] transition-all duration-200 border border-gray-200 hover:border-gray-300 mobile-no-overflow"
                >
                  <CardContent className="p-3 sm:p-4 lg:p-6 mobile-overflow-safe">
                    <div className="flex flex-col gap-3 sm:gap-4 mobile-overflow-safe">
                      {/* Header: Icon, Title, Status */}
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FileText className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0 mobile-overflow-safe">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 lg:gap-3 mb-2 mobile-overflow-safe">
                            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mobile-text-truncate min-w-0 flex-1">
                              {project.name}
                            </h3>
                            <Badge
                              className={`${getStatusColor(project.status)} text-xs lg:text-sm w-fit flex-shrink-0`}
                            >
                              <div className="flex items-center gap-1">
                                {getStatusIcon(project.status)}
                                <span className="hidden sm:inline">
                                  {getStatusText(project.status)}
                                </span>
                              </div>
                            </Badge>
                          </div>

                          {project.description && (
                            <p className="text-xs sm:text-sm lg:text-base text-gray-600 mb-2 sm:mb-3 line-clamp-safe">
                              {project.description}
                            </p>
                          )}

                          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-3 lg:gap-4 text-xs sm:text-sm text-gray-500 mobile-overflow-safe">
                            <div className="flex items-center gap-1 min-w-0 flex-1 sm:flex-none mobile-overflow-safe">
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span className="mobile-text-truncate min-w-0">{project.date}</span>
                            </div>
                            {project.budget && (
                              <div className="flex items-center gap-1 min-w-0 flex-1 sm:flex-none mobile-overflow-safe">
                                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span className="mobile-text-truncate min-w-0 font-medium">
                                  {(() => {
                                    const budget = project.budget;
                                    if (budget >= 1000000000) {
                                      return `$${(budget / 1000000000).toFixed(1)}B ${project.currency}`;
                                    } else if (budget >= 1000000) {
                                      return `$${(budget / 1000000).toFixed(1)}M ${project.currency}`;
                                    } else if (budget >= 1000) {
                                      return `$${(budget / 1000).toFixed(1)}K ${project.currency}`;
                                    } else {
                                      return `$${budget.toLocaleString()} ${project.currency}`;
                                    }
                                  })()}
                                </span>
                              </div>
                            )}
                            {project.candidatesCount !== undefined && (
                              <div className="flex items-center gap-1 min-w-0 flex-1 sm:flex-none mobile-overflow-safe">
                                <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span className="mobile-text-truncate min-w-0">
                                  {project.candidatesCount} candidates
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons - Vertical stack on mobile, horizontal on desktop */}
                      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-2 pt-1 min-w-0">
                        {/* View button - full width on mobile */}
                        <Link href={`/projects/${project.id}`} className="w-full sm:flex-none min-w-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs sm:text-sm h-8 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-150 w-full"
                          >
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                            <span className="truncate">View</span>
                          </Button>
                        </Link>
                        
                        {/* Action button (Complete/Review) - full width on mobile */}
                        <div className="w-full sm:flex-none min-w-0">
                          {project.status === "completed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className={`text-xs sm:text-sm h-8 transition-all duration-150 w-full ${
                                reviewedProjects.has(project.id)
                                  ? "opacity-50 cursor-not-allowed bg-gray-100 text-gray-500"
                                  : "hover:bg-green-50 hover:border-green-300 hover:text-green-700"
                              }`}
                              onClick={() =>
                                handleReviewProject(project.id, project.name)
                              }
                              disabled={reviewedProjects.has(project.id)}
                            >
                              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                              <span className="truncate">
                                {reviewedProjects.has(project.id)
                                  ? "Reviewed"
                                  : "Review"}
                              </span>
                            </Button>
                          )}
                          {project.status !== "completed" &&
                            project.status !== "draft" &&
                            project.status !== "canceled" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCompleteProject(project.id)}
                                disabled={completingProjects.has(project.id)}
                                className="text-green-600 border-green-600 hover:bg-green-50 hover:border-green-700 hover:text-green-700 text-xs sm:text-sm h-8 transition-all duration-150 w-full"
                              >
                                {completingProjects.has(project.id) ? (
                                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 animate-spin flex-shrink-0" />
                                ) : (
                                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                                )}
                                <span className="hidden sm:inline truncate">
                                  {completingProjects.has(project.id)
                                    ? "Completing..."
                                    : "Mark Complete"}
                                </span>
                                <span className="sm:hidden truncate">
                                  {completingProjects.has(project.id)
                                    ? "Completing..."
                                    : "Complete"}
                                </span>
                              </Button>
                            )}
                        </div>
                        
                        {/* More button - full width on mobile, inline on desktop */}
                        <div className="w-full sm:w-auto sm:ml-auto">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 sm:h-8 lg:h-9 w-full sm:w-auto flex-shrink-0"
                                type="button"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" sideOffset={6}>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/projects/${project.id}?edit=1`);
                                }}
                              >
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/projects/${project.id}`);
                                }}
                              >
                                View
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

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
