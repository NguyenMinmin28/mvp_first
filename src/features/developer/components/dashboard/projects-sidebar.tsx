"use client";

import { useEffect, useMemo, useState } from "react";
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
      <div className="h-full border p-4">
        <h3 className="text-base font-semibold mb-2">Projects</h3>
        <div className="text-sm">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col border border-gray-200 rounded-lg bg-white shadow-sm">
      <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">{getFilterLabel(filter)}</h3>
          <span className="text-xs border border-blue-200 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md font-medium">
            {filtered.length} project{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      
      <div className="flex-1 p-3 overflow-y-auto bg-gray-50">
        {filtered.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-sm text-gray-600">No projects found.</div>
            <div className="text-xs mt-1 text-gray-500">
              Projects will appear here when assigned to you.
            </div>
          </div>
        ) : (
          <div className="space-y-2">
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
      </div>
      
      {filtered.length > itemsPerPage && (
        <div className="border-t border-gray-200 p-3 bg-white">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
