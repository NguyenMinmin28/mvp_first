"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UserLayout } from "@/features/shared/components/user-layout";
import ProfileSummary from "@/features/developer/components/dashboard/profile-summary";
import IdeaSparkList from "@/features/developer/components/dashboard/ideaspark-list";
import ProjectStatusFilter from "@/features/developer/components/project-status-filter";
import type { ProjectStatus } from "@/features/developer/components/project-status-filter";
import ProjectsSidebar from "@/features/developer/components/dashboard/projects-sidebar";
import ProjectDetail from "@/features/developer/components/dashboard/project-detail";

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
      <div className="container mx-auto px-4 py-8">
        {/* Top Section - Profile and Activity Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Section - Takes 2/3 of the width */}
          <div className="lg:col-span-2">
            <ProfileSummary profile={profile} />
          </div>
          
          {/* Activity Section - Takes 1/3 of the width */}
          <div className="lg:col-span-1">
            <IdeaSparkList profile={profile} />
          </div>
        </div>
        
        {/* Project Status Filter */}
        <div className="mt-6">
          <ProjectStatusFilter value={projectStatus} onChange={setProjectStatus} />
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-400px)]">
          {/* Left Column - Projects List */}
          <div className="lg:col-span-1">
            <ProjectsSidebar 
              filter={projectStatus}
              selectedProjectId={selectedProject?.id || null}
              onProjectSelect={setSelectedProject}
              projects={projects}
            />
          </div>
          
          {/* Right Column - Project Detail */}
          <div className="lg:col-span-2">
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
    </UserLayout>
  );
}


