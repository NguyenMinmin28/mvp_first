"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Pagination } from "@/ui/components/pagination";
import { cn } from "@/core/utils/utils";
import ProjectCard from "./project-card";
import ManualInvitationsSidebar from "./manual-invitations-sidebar";
import type { ProjectStatus } from "../project-status-filter";
import { PortfolioModal } from "@/features/onboarding/freelancer/components/portfolio-modal";
import { Edit2, Upload } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

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

interface PortfolioSlot {
  id?: string;
  title: string;
  description: string;
  projectUrl: string;
  imageUrl: string;
  images?: string[];
  sortOrder: number;
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
  const { data: session } = useSession();
  const isDeveloper = session?.user?.role === "DEVELOPER";
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5; // Show 5 projects per page
  const [portfolios, setPortfolios] = useState<PortfolioSlot[]>([]);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);
  const [hoveredSlotIndex, setHoveredSlotIndex] = useState<number | null>(null);
  const [isLoadingPortfolios, setIsLoadingPortfolios] = useState(false);

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

  // Fetch portfolios for developer
  const fetchPortfolios = useCallback(async () => {
    if (!isDeveloper) return;
    
    try {
      setIsLoadingPortfolios(true);
      const response = await fetch('/api/portfolio', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setPortfolios(data.portfolios || []);
      }
    } catch (error) {
      console.error('Error fetching portfolios:', error);
    } finally {
      setIsLoadingPortfolios(false);
    }
  }, [isDeveloper]);

  useEffect(() => {
    if (isDeveloper) {
      fetchPortfolios();
    }
  }, [isDeveloper, fetchPortfolios]);

  // Handle portfolio save
  const handlePortfolioSave = useCallback(async (portfolio: {
    id?: string;
    title: string;
    description: string;
    projectUrl: string;
    imageUrl: string;
    images?: string[];
  }) => {
    if (editingSlotIndex === null) return;

    try {
      // Create full portfolios array with 6 slots
      const updatedPortfolios = Array.from({ length: 6 }, (_, index) => {
        if (index === editingSlotIndex) {
          return {
            id: portfolio.id,
            title: portfolio.title || '',
            description: portfolio.description || '',
            projectUrl: portfolio.projectUrl || '',
            imageUrl: portfolio.imageUrl || '',
            images: portfolio.images || [],
          };
        }
        // Keep existing portfolio or create empty slot
        return portfolios[index] || {
          title: '',
          description: '',
          projectUrl: '',
          imageUrl: '',
          images: [],
        };
      });

      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolios: updatedPortfolios }),
      });

      if (response.ok) {
        const data = await response.json();
        setPortfolios(data.portfolios || []);
        toast.success('Portfolio updated successfully');
        setIsPortfolioModalOpen(false);
        setEditingSlotIndex(null);
        // Refresh portfolios
        await fetchPortfolios();
      } else {
        throw new Error('Failed to save portfolio');
      }
    } catch (error) {
      console.error('Error saving portfolio:', error);
      toast.error('Failed to save portfolio');
    }
  }, [portfolios, editingSlotIndex, fetchPortfolios]);

  // Handle portfolio slot click
  const handlePortfolioSlotClick = (index: number) => {
    if (!isDeveloper) return;
    setEditingSlotIndex(index);
    setIsPortfolioModalOpen(true);
  };

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
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .modern-scrollbar-sidebar::-webkit-scrollbar {
          width: 10px !important;
          height: 10px !important;
        }
        .modern-scrollbar-sidebar::-webkit-scrollbar-track {
          background: rgba(243, 244, 246, 0.15) !important;
          border-radius: 10px !important;
          margin: 4px 0 !important;
        }
        .modern-scrollbar-sidebar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(156, 163, 175, 0.25), rgba(107, 114, 128, 0.3)) !important;
          border-radius: 10px !important;
          border: 2px solid rgba(243, 244, 246, 0.15) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
        }
        .modern-scrollbar-sidebar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, rgba(107, 114, 128, 0.4), rgba(75, 85, 99, 0.5)) !important;
          border-color: rgba(243, 244, 246, 0.25) !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08) !important;
        }
        .modern-scrollbar-sidebar {
          scrollbar-width: thin !important;
          scrollbar-color: rgba(107, 114, 128, 0.3) rgba(243, 244, 246, 0.15) !important;
        }
        .modern-scrollbar-sidebar:hover {
          scrollbar-color: rgba(75, 85, 99, 0.4) rgba(243, 244, 246, 0.2) !important;
        }
      `}} />
      <div className="h-full flex flex-col border border-gray-200 rounded-xl bg-white shadow-lg">
        <div className="border-b border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">{getFilterLabel(filter)}</h3>
            <span className="text-xs border border-blue-200 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-medium">
              {filtered.length} project{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto bg-white modern-scrollbar-sidebar">
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
          // Use portfolios from API if available (for developers), otherwise use portfolioLinks
          const displayPortfolios = isDeveloper && portfolios.length > 0 
            ? portfolios 
            : portfolioLinks.map((p, idx) => ({
                id: p.id,
                title: p.title || '',
                description: '',
                projectUrl: '',
                imageUrl: p.imageUrl || '',
                images: p.images || [],
                sortOrder: idx,
              }));

          // Debug logging
          if (isDeveloper) {
            console.log('📊 ProjectsSidebar - Portfolios data:', {
              portfoliosCount: portfolios.length,
              displayPortfoliosCount: displayPortfolios.length,
              portfolios: portfolios.map((p, idx) => ({
                index: idx,
                id: p.id,
                title: p.title,
                hasImageUrl: !!p.imageUrl,
                imagesCount: p.images?.filter(img => img && img.trim() !== '').length || 0,
                images: p.images,
              })),
            });
          }

          // Get first image from each portfolio for display
          const brandedLetters = ["C", "L", "E", "R", "V", "S"];
          
          // Create 6 slots - ensure we check all portfolios properly
          const slots = Array.from({ length: 6 }, (_, index) => {
            const portfolio = displayPortfolios[index];
            
            // Improved content check: portfolio has content if it has title, imageUrl, or any non-empty image
            const hasImageUrl = portfolio?.imageUrl && portfolio.imageUrl.trim() !== '';
            const hasImages = portfolio?.images && portfolio.images.some(img => img && img && img.trim() !== '');
            const hasTitle = portfolio?.title && portfolio.title.trim() !== '';
            const hasContent = portfolio && (hasImageUrl || hasImages || hasTitle);
            
            // Get first image: check images array first, then fallback to imageUrl
            let firstImage = '';
            if (portfolio?.images && Array.isArray(portfolio.images)) {
              const nonEmptyImage = portfolio.images.find(img => img && img.trim() !== '');
              if (nonEmptyImage) {
                firstImage = nonEmptyImage;
              }
            }
            if (!firstImage && portfolio?.imageUrl && portfolio.imageUrl.trim() !== '') {
              firstImage = portfolio.imageUrl;
            }
            
            return {
              portfolio,
              hasContent,
              imageUrl: firstImage,
              letter: brandedLetters[index],
              isEmpty: !hasContent,
            };
          });

          // Debug: count portfolios with content
          const portfoliosWithContent = slots.filter(s => s.hasContent).length;
          if (isDeveloper && portfoliosWithContent > 0) {
            console.log(`✅ ProjectsSidebar - Displaying ${portfoliosWithContent} portfolios with content`);
          }

          return (
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot, index) => {
                const isEmpty = slot.isEmpty;
                const isHovered = hoveredSlotIndex === index;
                
                return (
                  <div
                    key={index}
                    className={cn(
                      "aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gradient-to-br from-blue-50 to-purple-50 relative group cursor-pointer transition-all duration-200",
                      isEmpty && isDeveloper && "hover:border-blue-400 hover:shadow-md"
                    )}
                    onMouseEnter={() => setHoveredSlotIndex(index)}
                    onMouseLeave={() => setHoveredSlotIndex(null)}
                    onClick={() => isDeveloper && handlePortfolioSlotClick(index)}
                  >
                    {slot.hasContent && slot.imageUrl ? (
                      <>
                        <img
                          src={slot.imageUrl}
                          alt={slot.portfolio?.title || `Portfolio ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent && !parent.querySelector('.fallback-letter')) {
                              const fallback = document.createElement('div');
                              fallback.className = 'w-full h-full flex items-center justify-center fallback-letter';
                              fallback.innerHTML = `<span class="text-lg font-bold text-gray-400">${slot.letter}</span>`;
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                        {/* Edit icon on hover for filled slots */}
                        {isDeveloper && isHovered && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200">
                            <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
                              <Edit2 className="h-4 w-4 text-gray-700" />
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-lg font-bold text-gray-400">{slot.letter}</span>
                        </div>
                        {/* Upload icon on hover for empty slots */}
                        {isDeveloper && isHovered && (
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity duration-200">
                            <div className="bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-lg">
                              <Upload className="h-5 w-5 text-gray-700" />
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Portfolio Modal */}
      {isDeveloper && (
        <PortfolioModal
          isOpen={isPortfolioModalOpen}
          onClose={() => {
            setIsPortfolioModalOpen(false);
            setEditingSlotIndex(null);
          }}
          portfolio={editingSlotIndex !== null && portfolios[editingSlotIndex] 
            ? {
                id: portfolios[editingSlotIndex].id,
                title: portfolios[editingSlotIndex].title || '',
                description: portfolios[editingSlotIndex].description || '',
                projectUrl: portfolios[editingSlotIndex].projectUrl || '',
                imageUrl: portfolios[editingSlotIndex].imageUrl || '',
                images: portfolios[editingSlotIndex].images || [],
              }
            : {
                title: '',
                description: '',
                projectUrl: '',
                imageUrl: '',
                images: [],
              }
          }
          onSave={handlePortfolioSave}
          slotIndex={editingSlotIndex || 0}
        />
      )}
      </div>
    </>
  );
}
