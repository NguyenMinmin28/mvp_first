"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UserLayout } from "@/features/shared/components/user-layout";
import ProfileSummary from "@/features/developer/components/dashboard/profile-summary";
import IdeaSparkList from "@/features/developer/components/dashboard/ideaspark-list";
import ProjectStatusFilter from "@/features/developer/components/project-status-filter";
import type { ProjectStatus } from "@/features/developer/components/project-status-filter";
import ProjectsSidebar from "@/features/developer/components/dashboard/projects-sidebar";
import ProjectDetail from "@/features/developer/components/dashboard/project-detail";
import { Button } from "@/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { ChevronLeft, ChevronRight, TestTube } from "lucide-react";
import { toast } from "sonner";

interface UserIdeaSummary {
  id: string;
  title: string;
  summary: string;
  createdAt: string;
  _count: {
    likes: number;
    comments: number;
    bookmarks: number;
  };
}

interface AssignedProjectItem {
  id: string;
  name: string;
  description?: string;
  status: "recent" | "in_progress" | "completed" | "approved" | "rejected";
  date: string;
  budget?: number | null;
  currency?: string | null;
  skills?: string[];
  assignmentStatus?: string;
  assignment?: {
    id: string;
    acceptanceDeadline: string;
    responseStatus: "pending" | "accepted" | "rejected" | "expired";
    assignedAt: string;
    batchId: string;
  };
}

export default function DashboardUserPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [ideas, setIdeas] = useState<UserIdeaSummary[]>([]);
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>("NEW");
  const [selectedProject, setSelectedProject] = useState<AssignedProjectItem | null>(null);
  const [projects, setProjects] = useState<AssignedProjectItem[]>([]);
  const [currentProjectIndex, setCurrentProjectIndex] = useState<number>(0);
  const [isTestingBatch, setIsTestingBatch] = useState(false);
  
  // Ref for project detail container to detect clicks outside
  const projectDetailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.push("/auth/signin");
      return;
    }
    // Only allow developers here for now
    if (session.user.role !== "DEVELOPER") {
      router.push("/");
      return;
    }
    load();
  }, [status, session, router]);

  const load = async () => {
    try {
      setIsLoading(true);
      const [meRes, myIdeasRes, projectsRes] = await Promise.all([
        fetch("/api/user/me", { cache: "no-store" }),
        fetch("/api/user/my-ideas?limit=6", { cache: "no-store" }),
        fetch("/api/user/projects", { cache: "no-store" }),
      ]);
      if (meRes.ok) {
        const data = await meRes.json();
        setProfile(data.user);
      }
      if (myIdeasRes.ok) {
        const data = await myIdeasRes.json();
        setIdeas(Array.isArray(data.ideas) ? data.ideas : []);
      }
      if (projectsRes.ok) {
        const data = await projectsRes.json();
        setProjects(Array.isArray(data.projects) ? data.projects : []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (projectId: string) => {
    try {
      const response = await fetch(`/api/user/projects/${projectId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Update project status in local state
        setProjects(prev => prev.map(p => 
          p.id === projectId ? { ...p, status: 'approved' as const } : p
        ));
        
        // Update selected project if it's the one being approved
        if (selectedProject?.id === projectId) {
          setSelectedProject(prev => prev ? { ...prev, status: 'approved' as const } : null);
        }
        
        // Switch to approved tab
        setProjectStatus("APPROVED");
        
        alert('Project approved successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to approve project');
      }
    } catch (error) {
      console.error('Error approving project:', error);
      alert('Failed to approve project');
    }
  };

  // Test batch assignment function
  const handleTestBatchAssignment = async () => {
    setIsTestingBatch(true);
    try {
      const response = await fetch("/api/test-assign-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("🧪 Test batch assignment created! Check your notifications and projects.");
        
        // Refresh projects to show the new test assignment
        await load();
        
        // Trigger notification refresh in header
        window.dispatchEvent(new CustomEvent('notification-refresh'));
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create test batch assignment");
      }
    } catch (error) {
      console.error("Error creating test batch assignment:", error);
      toast.error("Something went wrong");
    } finally {
      setIsTestingBatch(false);
    }
  };

  const handleReject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/user/projects/${projectId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Update project status in local state
        setProjects(prev => prev.map(p => 
          p.id === projectId ? { ...p, status: 'rejected' as const } : p
        ));
        
        // Update selected project if it's the one being rejected
        if (selectedProject?.id === projectId) {
          setSelectedProject(prev => prev ? { ...prev, status: 'rejected' as const } : null);
        }
        
        // Switch to rejected tab
        setProjectStatus("REJECTED");
        
        alert('Project rejected successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to reject project');
      }
    } catch (error) {
      console.error('Error rejecting project:', error);
      alert('Failed to reject project');
    }
  };

  const handleExpired = async (projectId: string) => {
    try {
      const response = await fetch(`/api/user/projects/${projectId}/expire`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Update project status in local state
        setProjects(prev => prev.map(p => 
          p.id === projectId ? { ...p, status: 'rejected' as const } : p
        ));
        
        // Update selected project if it's the one being expired
        if (selectedProject?.id === projectId) {
          setSelectedProject(prev => prev ? { ...prev, status: 'rejected' as const } : null);
        }
        
        // Switch to rejected tab
        setProjectStatus("REJECTED");
        
        alert('Assignment expired! Project has been automatically rejected.');
      } else {
        const error = await response.json();
        console.error('Error expiring assignment:', error);
      }
    } catch (error) {
      console.error('Error expiring assignment:', error);
    }
  };

  // Filter projects based on status
  const filteredProjects = projects.filter((project) => {
    const now = new Date();
    const isPendingActive =
      project.assignment?.responseStatus === "pending" &&
      project.assignment?.acceptanceDeadline &&
      new Date(project.assignment.acceptanceDeadline) > now;
    switch (projectStatus) {
      case "NEW":
        return project.status === "recent" && isPendingActive;
      case "IN_PROGRESS":
        return project.status === "in_progress";
      case "COMPLETED":
        return project.status === "completed";
      case "APPROVED":
        return project.status === "approved";
      case "REJECTED":
        return project.status === "rejected";
      default:
        return true;
    }
  });

  // Handle mobile navigation
  const handlePreviousProject = () => {
    if (currentProjectIndex > 0) {
      const newIndex = currentProjectIndex - 1;
      setCurrentProjectIndex(newIndex);
      setSelectedProject(filteredProjects[newIndex]);
    }
  };

  const handleNextProject = () => {
    if (currentProjectIndex < filteredProjects.length - 1) {
      const newIndex = currentProjectIndex + 1;
      setCurrentProjectIndex(newIndex);
      setSelectedProject(filteredProjects[newIndex]);
    }
  };

  // Update selected project when filter changes
  useEffect(() => {
    if (filteredProjects.length > 0) {
      setCurrentProjectIndex(0);
      setSelectedProject(filteredProjects[0]);
    } else {
      setSelectedProject(null);
    }
  }, [projectStatus, projects]);

  const handleAcceptAssignment = async (projectId: string) => {
    try {
      const response = await fetch(`/api/user/projects/${projectId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Update project status in local state
        setProjects(prev => prev.map(p => 
          p.id === projectId ? { 
            ...p, 
            status: 'approved' as const,
            assignment: p.assignment ? { ...p.assignment, responseStatus: 'accepted' as const } : undefined
          } : p
        ));
        
        // Update selected project if it's the one being accepted
        if (selectedProject?.id === projectId) {
          setSelectedProject(prev => prev ? { 
            ...prev, 
            status: 'approved' as const,
            assignment: prev.assignment ? { ...prev.assignment, responseStatus: 'accepted' as const } : undefined
          } : null);
        }
        
        // Switch to approved tab
        setProjectStatus("APPROVED");
        
        alert('Assignment accepted successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to accept assignment');
      }
    } catch (error) {
      console.error('Error accepting assignment:', error);
      alert('Failed to accept assignment');
    }
  };

  const handleRejectAssignment = async (projectId: string) => {
    try {
      const response = await fetch(`/api/user/projects/${projectId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Update project status in local state
        setProjects(prev => prev.map(p => 
          p.id === projectId ? { 
            ...p, 
            status: 'rejected' as const,
            assignment: p.assignment ? { ...p.assignment, responseStatus: 'rejected' as const } : undefined
          } : p
        ));
        
        // Update selected project if it's the one being rejected
        if (selectedProject?.id === projectId) {
          setSelectedProject(prev => prev ? { 
            ...prev, 
            status: 'rejected' as const,
            assignment: prev.assignment ? { ...prev.assignment, responseStatus: 'rejected' as const } : undefined
          } : null);
        }
        
        // Switch to rejected tab
        setProjectStatus("REJECTED");
        
        alert('Assignment rejected successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to reject assignment');
      }
    } catch (error) {
      console.error('Error rejecting assignment:', error);
      alert('Failed to reject assignment');
    }
  };

  // Handle click outside to close project detail
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (projectDetailRef.current && !projectDetailRef.current.contains(event.target as Node)) {
        // Check if click is not on a project card (to avoid closing when selecting a project)
        const target = event.target as HTMLElement;
        const isProjectCard = target.closest('[data-project-card]');
        
        if (!isProjectCard && selectedProject) {
          setSelectedProject(null);
        }
      }
    };

    if (selectedProject) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedProject]);

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  if (!session?.user) return null;

  return (
    <UserLayout user={session.user}>
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Top Section - Profile and Activity Side by Side */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* Profile Section - Takes 2/3 of the width on xl screens */}
          <div className="xl:col-span-2">
            <ProfileSummary profile={profile} />
          </div>
          
          {/* Activity Section - Takes 1/3 of the width on xl screens */}
          <div className="xl:col-span-1">
            <IdeaSparkList profile={profile} />
          </div>
        </div>
        
        {/* Project Status Filter */}
        <div className="mt-4 sm:mt-6">
          <ProjectStatusFilter value={projectStatus} onChange={setProjectStatus} />
        </div>

        {/* Test Tools Card */}
        <div className="mt-4 sm:mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TestTube className="h-5 w-5" />
                Test Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Create a test batch assignment to simulate receiving a new project invitation and notification.
                </p>
                <Button
                  onClick={handleTestBatchAssignment}
                  disabled={isTestingBatch}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  {isTestingBatch ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                      Creating Test Assignment...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2" />
                      Create Test Batch Assignment
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Responsive Layout */}
        <div className="mt-4 sm:mt-6">
          {/* Mobile Navigation - Only show on mobile when projects exist */}
          {filteredProjects.length > 0 && (
            <div className="xl:hidden mb-4">
              <div className="flex items-center justify-between bg-white rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousProject}
                    disabled={currentProjectIndex === 0}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm font-medium">
                    {currentProjectIndex + 1} of {filteredProjects.length}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextProject}
                    disabled={currentProjectIndex === filteredProjects.length - 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-sm text-gray-600">
                  {selectedProject?.name || "No project selected"}
                </div>
              </div>
            </div>
          )}

          {/* Mobile: Stack vertically, Desktop: Side by side */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 min-h-[500px] xl:min-h-[calc(100vh-400px)]">
            {/* Left Column - Projects List */}
            <div className="xl:col-span-1 order-1 xl:order-1">
              <ProjectsSidebar 
                filter={projectStatus}
                selectedProjectId={selectedProject?.id || null}
                onProjectSelect={(project) => {
                  setSelectedProject(project);
                  // Update current index when project is selected from sidebar
                  if (project) {
                    const index = filteredProjects.findIndex(p => p.id === project.id);
                    if (index !== -1) {
                      setCurrentProjectIndex(index);
                    }
                  }
                }}
                projects={projects}
              />
            </div>
            
            {/* Right Column - Project Detail */}
            <div className="xl:col-span-2 order-2 xl:order-2" ref={projectDetailRef}>
              <ProjectDetail 
                project={selectedProject} 
                onApprove={handleApprove}
                onReject={handleReject}
                onExpired={handleExpired}
                onAcceptAssignment={handleAcceptAssignment}
                onRejectAssignment={handleRejectAssignment}
              />
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}


