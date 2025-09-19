"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Badge } from "@/ui/components/badge";
import { Input } from "@/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/components/select";
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
  MoreHorizontal
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { ProjectReviewModal } from "./project-review-modal";

interface Project {
  id: string;
  name: string;
  status: "draft" | "submitted" | "assigning" | "accepted" | "in_progress" | "completed" | "canceled";
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
    try {
      const stored = sessionStorage.getItem('myProjectsInitialTab');
      if (stored === 'active' || stored === 'completed' || stored === 'draft' || stored === 'all') {
        setActiveTab(stored);
        sessionStorage.removeItem('myProjectsInitialTab');
      }
    } catch {}
  }, []);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(8);
  const [completingProjects, setCompletingProjects] = useState<Set<string>>(new Set());
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState<{
    projectId: string;
    projectTitle: string;
    developers: Array<{ id: string; name: string; image?: string }>;
  } | null>(null);
  const [reviewedProjects, setReviewedProjects] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchProjects();
  }, []);

  // Check review status for all completed projects
  useEffect(() => {
    const checkReviewStatus = async () => {
      const completedProjects = projects.filter(p => p.status === "completed");
      const reviewStatusPromises = completedProjects.map(async (project) => {
        try {
          const response = await fetch(`/api/projects/${project.id}/reviews/status`);
          if (response.ok) {
            const data = await response.json();
            return { projectId: project.id, hasReviews: data.hasReviews };
          }
        } catch (error) {
          console.error(`Error checking review status for project ${project.id}:`, error);
        }
        return { projectId: project.id, hasReviews: false };
      });

      const results = await Promise.all(reviewStatusPromises);
      const reviewedSet = new Set(
        results.filter(r => r.hasReviews).map(r => r.projectId)
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
        credentials: 'include',
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
      setCompletingProjects(prev => new Set(prev).add(projectId));
      
      const response = await fetch(`/api/projects/${projectId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // If there are developers to review, show review modal
        if (data.acceptedDevelopers && data.acceptedDevelopers.length > 0) {
          setReviewData({
            projectId,
            projectTitle: data.project.title,
            developers: data.acceptedDevelopers
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
      setCompletingProjects(prev => {
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
      setReviewedProjects(prev => new Set(prev).add(reviewData.projectId));
    }
  };

  const handleReviewProject = async (projectId: string, projectTitle: string) => {
    try {
      // First check if project already has reviews
      const reviewCheckResponse = await fetch(`/api/projects/${projectId}/reviews/status`);
      
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
        const acceptedDevelopers = data.candidates
          ?.filter((candidate: any) => candidate.responseStatus === "accepted")
          ?.map((candidate: any) => ({
            id: candidate.developer.id,
            name: candidate.developer.user.name,
            image: candidate.developer.photoUrl || candidate.developer.user.image
          })) || [];


        if (acceptedDevelopers.length > 0) {
          setReviewData({
            projectId,
            projectTitle,
            developers: acceptedDevelopers
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

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    const matchesTab = activeTab === "all" || 
      (activeTab === "active" && ["submitted", "assigning", "accepted", "in_progress"].includes(project.status)) ||
      (activeTab === "completed" && project.status === "completed") ||
      (activeTab === "draft" && project.status === "draft");
    
    return matchesSearch && matchesStatus && matchesTab;
  });

  // Reset page on filters/search/tab changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const startIdx = (page - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const visibleProjects = filteredProjects.slice(startIdx, endIdx);

  const getTabCount = (tab: string) => {
    switch (tab) {
      case "all":
        return projects.length;
      case "active":
        return projects.filter(p => ["submitted", "assigning", "accepted", "in_progress"].includes(p.status)).length;
      case "completed":
        return projects.filter(p => p.status === "completed").length;
      case "draft":
        return projects.filter(p => p.status === "draft").length;
      default:
        return 0;
    }
  };

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
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">My Projects</h1>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Card>
          <CardContent className="p-3 lg:p-4">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="p-1.5 lg:p-2 bg-blue-100 rounded-lg">
                <FileText className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-gray-600">Total Projects</p>
                <p className="text-lg lg:text-2xl font-bold">{projects.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 lg:p-4">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="p-1.5 lg:p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-4 w-4 lg:h-5 lg:w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-gray-600">Completed</p>
                <p className="text-lg lg:text-2xl font-bold">
                  {projects.filter(p => p.status === "completed").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 lg:p-4">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="p-1.5 lg:p-2 bg-blue-100 rounded-lg">
                <Clock className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-gray-600">In Progress</p>
                <p className="text-lg lg:text-2xl font-bold">
                  {projects.filter(p => ["submitted", "assigning", "accepted", "in_progress"].includes(p.status)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 lg:p-4">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="p-1.5 lg:p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="h-4 w-4 lg:h-5 lg:w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-gray-600">Total Budget</p>
                <p className="text-lg lg:text-2xl font-bold">
                  ${projects.reduce((sum, p) => sum + (p.budget || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
            <div className="flex-1">
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 text-sm lg:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
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
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="w-full sm:w-36 text-sm lg:text-base">
                <SelectValue placeholder="Page size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 / page</SelectItem>
                <SelectItem value="8">8 / page</SelectItem>
                <SelectItem value="12">12 / page</SelectItem>
                <SelectItem value="16">16 / page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 lg:space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 bg-gray-100">
          <TabsTrigger value="all" className="text-xs lg:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-150">All ({getTabCount("all")})</TabsTrigger>
          <TabsTrigger value="active" className="text-xs lg:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-150">Active ({getTabCount("active")})</TabsTrigger>
          <TabsTrigger value="completed" className="text-xs lg:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-150">Completed ({getTabCount("completed")})</TabsTrigger>
          <TabsTrigger value="draft" className="text-xs lg:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-150">Draft ({getTabCount("draft")})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-3 lg:space-y-4">
          {filteredProjects.length === 0 ? (
            <Card>
              <CardContent className="p-6 lg:p-8 text-center">
                <FileText className="h-8 w-8 lg:h-12 lg:w-12 text-gray-400 mx-auto mb-3 lg:mb-4" />
                <h3 className="text-base lg:text-lg font-medium text-gray-900  mb-2">
                  No projects found
                </h3>
                <p className="text-sm lg:text-base text-gray-500  mb-3 lg:mb-4">
                  {searchTerm || statusFilter !== "all" 
                    ? "Try adjusting your search or filters"
                    : "Get started by creating your first project"
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 lg:gap-4">
              {visibleProjects.map((project) => (
                <Card key={project.id} className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border border-gray-200 hover:border-gray-300">
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 lg:gap-4">
                      <div className="flex items-start gap-3 lg:gap-4 flex-1">
                        <div className="flex items-center justify-center flex-shrink-0">
                          <FileText className="h-6 w-6 lg:h-8 lg:w-8 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 lg:gap-3 mb-2">
                            <h3 className="text-base lg:text-lg font-semibold text-gray-900  truncate">
                              {project.name}
                            </h3>
                            <Badge className={`${getStatusColor(project.status)} text-xs lg:text-sm`}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(project.status)}
                                <span className="hidden sm:inline">{getStatusText(project.status)}</span>
                              </div>
                            </Badge>
                          </div>
                          
                          {project.description && (
                            <p className="text-sm lg:text-base text-gray-600  mb-2 lg:mb-3 line-clamp-2">
                              {project.description}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-2 lg:gap-4 text-xs lg:text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 lg:h-4 lg:w-4" />
                              {project.date}
                            </div>
                            {project.budget && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3 lg:h-4 lg:w-4" />
                                {project.budget.toLocaleString()} {project.currency}
                              </div>
                            )}
                            {project.candidatesCount !== undefined && (
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3 lg:h-4 lg:w-4" />
                                {project.candidatesCount} candidates
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-1 lg:gap-2">
                        <Link href={`/projects/${project.id}`}>
                          <Button variant="outline" size="sm" className="text-xs lg:text-sm h-8 lg:h-9 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-150">
                            <Eye className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        {project.status === "completed" && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className={`text-xs lg:text-sm h-8 lg:h-9 transition-all duration-150 ${
                              reviewedProjects.has(project.id) 
                                ? "opacity-50 cursor-not-allowed bg-gray-100 text-gray-500" 
                                : "hover:bg-green-50 hover:border-green-300 hover:text-green-700"
                            }`}
                            onClick={() => handleReviewProject(project.id, project.name)}
                            disabled={reviewedProjects.has(project.id)}
                          >
                            <MessageSquare className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                            {reviewedProjects.has(project.id) ? "Reviewed" : "Review"}
                          </Button>
                        )}
                        {(project.status !== "completed" && project.status !== "draft" && project.status !== "canceled") && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleCompleteProject(project.id)}
                            disabled={completingProjects.has(project.id)}
                            className="text-green-600 border-green-600 hover:bg-green-50 hover:border-green-700 hover:text-green-700 text-xs lg:text-sm h-8 lg:h-9 transition-all duration-150"
                          >
                            {completingProjects.has(project.id) ? (
                              <Clock className="h-3 w-3 lg:h-4 lg:w-4 mr-1 animate-spin" />
                            ) : (
                              <CheckCircle className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                            )}
                            <span className="hidden sm:inline">
                              {completingProjects.has(project.id) ? "Completing..." : "Mark Complete"}
                            </span>
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-8 lg:h-9">
                          <MoreHorizontal className="h-3 w-3 lg:h-4 lg:w-4" />
                        </Button>
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
      {filteredProjects.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium">{startIdx + 1}</span> – <span className="font-medium">{Math.min(endIdx, filteredProjects.length)}</span>
            {" "}of <span className="font-medium">{filteredProjects.length}</span> projects
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1}>First</Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
            <span className="text-sm text-gray-700">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
            <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page === totalPages}>Last</Button>
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
      
    </div>
  );
}
