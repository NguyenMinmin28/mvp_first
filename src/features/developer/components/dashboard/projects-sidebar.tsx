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
  portfolioLinks?: Array<{
    id?: string;
    title?: string;
    imageUrl?: string;
    images?: string[];
  }>;
}

export default function ProjectsSidebar({ 
  filter, 
  selectedProjectId, 
  onProjectSelect,
  projects = [],
  selectedInvitationId,
  onInvitationSelect,
  portfolioLinks = []
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
      <div className="h-full border border-gray-200 bg-white rounded-xl shadow-lg p-4">
        <h3 className="text-base font-semibold mb-2 text-gray-900">Projects</h3>
        <div className="text-sm text-gray-600">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col border border-gray-200 rounded-xl bg-white shadow-lg">
      <div className="border-b border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">{getFilterLabel(filter)}</h3>
          <span className="text-xs border border-blue-200 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-medium">
            {filtered.length} project{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto bg-white">
        {filtered.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-sm text-gray-600">No projects found.</div>
            <div className="text-xs mt-2 text-gray-500">
              Projects will appear here when assigned to you.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
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
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Portfolio Images Section */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <h4 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">Portfolio</h4>
        {(() => {
          // Get all portfolio images (from all portfolios, including all images)
          const allImages: string[] = [];
          portfolioLinks.forEach((portfolio) => {
            if (portfolio.images && Array.isArray(portfolio.images)) {
              // Get all non-empty images (including main image)
              const nonEmptyImages = portfolio.images.filter(img => img && img.trim() !== "");
              allImages.push(...nonEmptyImages);
            } else if (portfolio.imageUrl) {
              // Fallback: if no images array, use imageUrl
              allImages.push(portfolio.imageUrl);
            }
          });

          // Take first 6 images
          const displayImages = allImages.slice(0, 6);
          const brandedLetters = ["C", "L", "E", "R", "V", "S"];

          // Fill remaining slots with branded letters if needed
          const slots = Array.from({ length: 6 }, (_, index) => {
            if (index < displayImages.length) {
              return { type: 'image' as const, url: displayImages[index] };
            }
            return { type: 'letter' as const, letter: brandedLetters[index] };
          });

          return (
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gradient-to-br from-blue-50 to-purple-50"
                >
                  {slot.type === 'image' ? (
                    <img
                      src={slot.url}
                      alt={`Portfolio ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // On error, show letter instead
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `<div class="w-full h-full flex items-center justify-center"><span class="text-lg font-bold text-gray-400">${brandedLetters[index]}</span></div>`;
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-lg font-bold text-gray-400">{slot.letter}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
