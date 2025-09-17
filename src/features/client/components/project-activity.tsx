"use client";

import { useState, useEffect } from "react";
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
  List as ListIcon
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
  const pageSize = viewMode === "grid" ? 8 : 5;
  const router = useRouter();

  useEffect(() => {
    fetchProjects();
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

  const getRecentProjects = () => {
    // Get the most recent project (first in the list)
    return projects.slice(0, 1);
  };
  
  const getInProgressProjects = () => {
    // Get projects that are actively being worked on
    return projects.filter(p => 
      p.status === "in_progress" || 
      p.status === "assigning" || 
      p.status === "accepted"
    );
  };
  
  const getCompletedProjects = () => {
    // Get completed projects
    return projects.filter(p => p.status === "completed");
  };

  const formatStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      'draft': 'Draft',
      'submitted': 'Submitted',
      'assigning': 'Assigning',
      'accepted': 'Accepted',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'canceled': 'Canceled'
    };
    return statusMap[status] || status.replace('_', ' ').toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
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
    <div className="mt-24 md:mt-36 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-extrabold text-gray-900">Project Overview</h2>

        <div className="flex items-center gap-3">
          <button
            className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
              viewMode === "grid" ? "bg-black text-white" : "border border-black text-black"
            }`}
            onClick={() => { setViewMode("grid"); setPage(1); }}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-6 w-6" />
          </button>
          <button
            className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
              viewMode === "list" ? "bg-black text-white" : "border border-black text-black"
            }`}
            onClick={() => { setViewMode("list"); setPage(1); }}
            aria-label="List view"
          >
            <ListIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className={`${viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4" : "grid grid-cols-1"} gap-6`}>
        {projects.slice((page - 1) * pageSize, page * pageSize).map((project) => {
          const isDraft = project.status === "draft" || project.status === "submitted";
          return (
            <Card key={project.id} className="rounded-2xl border border-gray-300 shadow-sm">
              <CardContent className={`p-6 space-y-4 ${viewMode === "list" ? "md:grid md:grid-cols-[auto_1fr_auto] md:items-center md:gap-6" : ""}`}>
                {/* Header */}
                <div className={`${viewMode === "list" ? "col-span-1" : ""} flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center">
                      <img src="/images/client/projecticon.png" alt="project" className="h-6 w-6 object-contain" />
                    </div>
                    <h3 className="font-semibold text-gray-900">{project.name}</h3>
                  </div>
                  <span className="text-gray-400">•••</span>
                </div>

                {/* Status */}
                <div className={`${viewMode === "list" ? "col-span-1" : ""} text-sm font-semibold text-gray-900`}>
                  {formatStatus(project.status)}
                </div>

                {/* Description (fixed height to equalize cards) */}
                <div className={`${viewMode === "list" ? "col-span-1" : ""} min-h-[56px]`}>
                  <p className="text-sm text-gray-600">
                    {project.description && project.description.trim().length > 0
                      ? project.description
                      : ""}
                  </p>
                </div>

                {/* Action */}
                <div className={`${viewMode === "list" ? "col-span-1" : ""}`}>
                  <Button
                    className={`${
                      isDraft
                        ? "bg-black text-white hover:bg-black/90 active:bg-black/90"
                        : "bg-white text-gray-900 border border-gray-300 hover:bg-black hover:text-white active:bg-black active:text-white"
                    } w-full h-10 transition-colors`}
                    variant={isDraft ? "default" : "outline"}
                    onClick={() => router.push(`/projects/${project.id}`)}
                  >
                    Fill in Draft
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pagination */}
      {projects.length > pageSize && (
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
