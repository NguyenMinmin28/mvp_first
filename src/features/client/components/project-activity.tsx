"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Badge } from "@/ui/components/badge";
import { 
  FileText,
  Star,
  Calendar,
  Eye,
  MessageSquare,
  LayoutGrid,
  List as ListIcon,
  MoreHorizontal,
  Share,
  Sparkles
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  name: string;
  status: "draft" | "submitted" | "assigning" | "accepted" | "in_progress" | "completed" | "canceled";
  date: string;
  logo?: string;
  description?: string;
}

export default function ProjectActivity() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewedProjects, setReviewedProjects] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState<number>(1);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [visibleProjects, setVisibleProjects] = useState<Set<string>>(new Set());
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  const pageSize = viewMode === "grid" ? 4 : 5;
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const projectId = entry.target.getAttribute('data-project-id');
            if (projectId) {
              setVisibleProjects(prev => new Set([...prev, projectId]));
            }
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    const projectElements = document.querySelectorAll('[data-project-id]');
    projectElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [projects]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Check review status for completed projects
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
      const response = await fetch("/api/projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      } else {
        // No fallback data - show empty state
        setProjects([]);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };


  const formatStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      'draft': 'Draft',
      'submitted': 'Submitted',
      'assigning': 'Pending job post',
      'accepted': 'Accepted',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'canceled': 'Canceled'
    };
    return statusMap[status] || status.replace('_', ' ').toUpperCase();
  };

  const handleDropdownToggle = (projectId: string) => {
    setOpenDropdown(openDropdown === projectId ? null : projectId);
  };

  const handleViewProject = (projectId: string) => {
    router.push(`/projects/${projectId}`);
    setOpenDropdown(null);
  };

  const handleShareProject = (projectId: string) => {
    // TODO: Implement share project functionality
    console.log('Share project:', projectId);
    setOpenDropdown(null);
  };

  // Component is now available for all users, but shows only 4 projects

  if (isLoading) {
    return (
      <div className="mt-24 md:mt-36 space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-10 w-64 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded-lg"></div>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-gray-200 animate-pulse rounded-lg"></div>
            <div className="h-12 w-12 bg-gray-200 animate-pulse rounded-lg"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Card key={idx} className="rounded-2xl border border-gray-300 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-gray-200 animate-pulse rounded-lg"></div>
                    <div className="h-6 w-32 bg-gray-200 animate-pulse rounded"></div>
                  </div>
                  <div className="h-6 w-6 bg-gray-200 animate-pulse rounded"></div>
                </div>
                <div className="h-5 w-20 bg-gray-200 animate-pulse rounded"></div>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded"></div>
                </div>
                <div className="h-10 w-full bg-gray-200 animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Project Activity
        </h2>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900  mb-2">
                No projects yet
              </h3>
              <p className="text-gray-500">
                Start by creating your first project to see activity here.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div ref={sectionRef} className="mt-24 md:mt-36 space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div className="flex items-center gap-3">
          <h2 className="text-4xl font-extrabold text-gray-900 hover:text-blue-600 transition-all duration-300 cursor-pointer title-glow title-underline">
            Project Overview
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            className={`h-12 w-12 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105 ${
              viewMode === "grid" 
                ? "bg-black text-white shadow-lg" 
                : "border border-black text-black hover:bg-gray-50"
            }`}
            onClick={() => { setViewMode("grid"); setPage(1); }}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-6 w-6" />
          </button>
          <button
            className={`h-12 w-12 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105 ${
              viewMode === "list" 
                ? "bg-black text-white shadow-lg" 
                : "border border-black text-black hover:bg-gray-50"
            }`}
            onClick={() => { setViewMode("list"); setPage(1); }}
            aria-label="List view"
          >
            <ListIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className={`${viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" : "space-y-0 border border-gray-300 rounded-2xl overflow-hidden"}`}>
        {projects.slice((page - 1) * pageSize, page * pageSize).map((project, index) => {
          const isDraft = project.status === "draft" || project.status === "submitted";
          const isLastItem = index === projects.slice((page - 1) * pageSize, page * pageSize).length - 1;
          const isVisible = visibleProjects.has(project.id);
          const isHovered = hoveredProject === project.id;
          
          return (
            <Card 
              key={project.id} 
              data-project-id={project.id}
              className={`
                ${viewMode === "list" ? "rounded-none border-l-0 border-r-0 border-t-0" : "rounded-2xl border border-gray-300 shadow-sm"} 
                ${viewMode === "list" && !isLastItem ? "border-b border-gray-200" : viewMode === "list" ? "border-b border-gray-300" : ""}
                transition-all duration-500 transform
                ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
                hover:shadow-xl hover:scale-105 hover:-translate-y-2
                ${isHovered ? "ring-2 ring-blue-500 ring-opacity-50" : ""}
                group cursor-pointer
              `}
              style={{ transitionDelay: `${index * 100}ms` }}
              onMouseEnter={() => setHoveredProject(project.id)}
              onMouseLeave={() => setHoveredProject(null)}
            >
              <CardContent className={`${viewMode === "list" ? "p-3" : "p-6"} ${viewMode === "list" ? "flex items-center justify-between" : "space-y-4"}`}>
                {viewMode === "list" ? (
                  <>
                    {/* Icon */}
                    <div className="flex h-10 w-10 items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <img src="/images/client/projecticon.png" alt="project" className="h-6 w-6 object-contain" />
                    </div>

                    {/* Project Name */}
                    <div className="flex-shrink-0 w-1/5">
                      <h3 className="font-semibold text-gray-900 leading-tight">{project.name}</h3>
                    </div>

                    {/* Status */}
                    <div className="flex-shrink-0 w-1/6">
                      <Badge 
                        className={`
                          text-sm font-bold truncate transition-all duration-300
                          ${isDraft 
                            ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" 
                            : project.status === "completed" 
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : project.status === "in_progress"
                            ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                          }
                          group-hover:scale-105
                        `}
                      >
                        {formatStatus(project.status)}
                      </Badge>
                    </div>

                    {/* Description */}
                    <div className="flex-1 min-w-0 mx-4">
                      <p className="text-sm text-gray-600 truncate">
                        {project.description && project.description.trim().length > 0
                          ? project.description
                          : ""}
                      </p>
                    </div>

                    {/* Button */}
                    <div className="flex-1 min-w-0">
                      <Button
                        className={`
                          h-8 w-full text-sm transition-all duration-300 transform
                          ${isDraft
                            ? "bg-black text-white hover:bg-black/90 active:bg-black/90 hover:scale-105"
                            : "bg-white text-gray-900 border border-gray-300 hover:bg-black hover:text-white active:bg-black active:text-white hover:scale-105"
                          }
                          group-hover:shadow-lg
                        `}
                        variant={isDraft ? "default" : "outline"}
                        onClick={() => router.push(`/projects/${project.id}`)}
                      >
                        <span className="flex items-center gap-2">
                          Fill in Draft
                          {isDraft && <Sparkles className="h-3 w-3 animate-pulse" />}
                        </span>
                      </Button>
                    </div>

                    {/* More options */}
                    <div className="flex-shrink-0 ml-4 relative" ref={dropdownRef}>
                      <button
                        onClick={() => handleDropdownToggle(project.id)}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </button>
                      
                      {openDropdown === project.id && (
                        <div className="absolute right-0 top-8 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                          <div className="py-1">
                            <button
                              onClick={() => handleViewProject(project.id)}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View Project
                            </button>
                            <button
                              onClick={() => handleShareProject(project.id)}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <Share className="w-4 h-4" />
                              Share
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Grid view layout */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <img src="/images/client/projecticon.png" alt="project" className="h-8 w-8 object-contain" />
                        </div>
                        <h3 className="font-semibold text-gray-900 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors duration-300">{project.name}</h3>
                      </div>
                      <div className="relative" ref={dropdownRef}>
                        <button
                          onClick={() => handleDropdownToggle(project.id)}
                          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4 text-gray-400" />
                        </button>
                        
                        {openDropdown === project.id && (
                          <div className="absolute right-0 top-8 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                            <div className="py-1">
                              <button
                                onClick={() => handleViewProject(project.id)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <Eye className="w-4 h-4" />
                                View Project
                              </button>
                              <button
                                onClick={() => handleShareProject(project.id)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <Share className="w-4 h-4" />
                                Share
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-sm font-semibold">
                      <Badge 
                        className={`
                          transition-all duration-300
                          ${isDraft 
                            ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" 
                            : project.status === "completed" 
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : project.status === "in_progress"
                            ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                          }
                          group-hover:scale-105
                        `}
                      >
                        {formatStatus(project.status)}
                      </Badge>
                    </div>

                    <div className="min-h-[56px] max-h-[84px] overflow-hidden">
                      <p className="text-sm text-gray-600 line-clamp-4">
                        {project.description && project.description.trim().length > 0
                          ? project.description
                          : ""}
                      </p>
                    </div>

                    <div>
                      <Button
                        className={`
                          w-full h-10 transition-all duration-300 transform
                          ${isDraft
                            ? "bg-black text-white hover:bg-black/90 active:bg-black/90 hover:scale-105"
                            : "bg-white text-gray-900 border border-gray-300 hover:bg-black hover:text-white active:bg-black active:text-white hover:scale-105"
                          }
                          group-hover:shadow-lg
                        `}
                        variant={isDraft ? "default" : "outline"}
                        onClick={() => router.push(`/projects/${project.id}`)}
                      >
                        <span className="flex items-center gap-2">
                          See details
                          {isDraft && <Sparkles className="h-3 w-3 animate-pulse" />}
                        </span>
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pagination - only show in list view */}
      {viewMode === "list" && projects.length > pageSize && (
        <div className="flex items-center justify-center gap-4 pt-2">
          <Button
            variant="outline"
            className="h-9 px-3"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Prev
          </Button>
          <span className="text-sm text-gray-700">
            Page {page} of {Math.max(1, Math.ceil(projects.length / pageSize))}
          </span>
          <Button
            variant="outline"
            className="h-9 px-3"
            onClick={() => setPage((p) => Math.min(Math.ceil(projects.length / pageSize), p + 1))}
            disabled={page >= Math.ceil(projects.length / pageSize)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
