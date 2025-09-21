"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Badge } from "@/ui/components/badge";
import { Pagination } from "@/ui/components/pagination";
import { cn } from "@/core/utils/utils";
import ProjectCard from "./project-card";
import ManualInvitationsSidebar from "./manual-invitations-sidebar";
import type { ProjectStatus } from "../project-status-filter";

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
    responseStatus: string;
    assignedAt: string;
    batchId: string;
    source?: "AUTO_ROTATION" | "MANUAL_INVITE";
    clientMessage?: string;
  };
  isManualInvite?: boolean;
  originalProjectId?: string;
}

interface ProjectsSidebarProps {
  filter: ProjectStatus;
  selectedProjectId: string | null;
  onProjectSelect: (project: AssignedProjectItem | null) => void;
  projects?: AssignedProjectItem[];
  selectedInvitationId?: string | null;
  onInvitationSelect?: (invitation: any | null) => void;
}

export default function ProjectsSidebar({ 
  filter, 
  selectedProjectId, 
  onProjectSelect,
  projects = [],
  selectedInvitationId,
  onInvitationSelect
}: ProjectsSidebarProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5; // Show 5 projects per page

  const filtered = useMemo(() => {
    const now = new Date();
    const isPendingActive = (p: AssignedProjectItem) =>
      p.assignment?.responseStatus === "pending" &&
      p.assignment?.acceptanceDeadline &&
      new Date(p.assignment.acceptanceDeadline) > now;
    
    const isAcceptedAndNotCompleted = (p: AssignedProjectItem) =>
      p.assignment?.responseStatus === "accepted" && p.status !== "completed";
    
    switch (filter) {
      case "NEW":
        return projects.filter((p) => 
          p.status === "recent" && isPendingActive(p)
        );
      case "IN_PROGRESS":
        // Show projects where freelancer accepted and client hasn't completed
        return projects.filter((p) => isAcceptedAndNotCompleted(p));
      case "COMPLETED":
        return projects.filter((p) => p.status === "completed");
      case "APPROVED":
        // Show projects where freelancer accepted (can overlap with IN_PROGRESS)
        return projects.filter((p) => p.assignment?.responseStatus === "accepted");
      case "REJECTED":
        return projects.filter((p) => p.status === "rejected");
      case "MANUAL_INVITATIONS":
        // Return empty array for manual invitations - they will be handled separately
        return [];
      default:
        return projects;
    }
  }, [filter, projects]);

  // Calculate pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProjects = filtered.slice(startIndex, endIndex);

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const getFilterLabel = (filter: ProjectStatus) => {
    switch (filter) {
      case "NEW":
        return "New Projects";
      case "IN_PROGRESS":
        return "In Progress";
      case "COMPLETED":
        return "Completed";
      case "APPROVED":
        return "Approved";
      case "REJECTED":
        return "Rejected";
      default:
        return "All Projects";
    }
  };

  // Show Manual Invitations Sidebar when filter is MANUAL_INVITATIONS
  if (filter === "MANUAL_INVITATIONS") {
    return (
      <ManualInvitationsSidebar
        selectedInvitationId={selectedInvitationId || null}
        onInvitationSelect={onInvitationSelect || (() => {})}
      />
    );
  }

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">Projects</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-sm text-gray-600">
          Loading projects...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b p-3 sm:p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg">{getFilterLabel(filter)}</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {filtered.length} project{filtered.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-3 sm:p-4 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-center text-gray-500 py-6 sm:py-8">
            <div className="text-sm">No projects found.</div>
            <div className="text-xs text-gray-400 mt-1">
              Projects will appear here when assigned to you.
            </div>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {paginatedProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isSelected={selectedProjectId === project.id}
                onClick={() => onProjectSelect(project)}
              />
            ))}
          </div>
        )}
      </CardContent>
      
      {/* Pagination Controls */}
      {filtered.length > itemsPerPage && (
        <div className="border-t p-3 sm:p-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </Card>
  );
}
