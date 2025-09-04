"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Badge } from "@/ui/components/badge";
import { cn } from "@/core/utils/utils";
import ProjectCard from "./project-card";
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
}

interface ProjectsSidebarProps {
  filter: ProjectStatus;
  selectedProjectId: string | null;
  onProjectSelect: (project: AssignedProjectItem | null) => void;
  projects?: AssignedProjectItem[];
}

export default function ProjectsSidebar({ 
  filter, 
  selectedProjectId, 
  onProjectSelect,
  projects = []
}: ProjectsSidebarProps) {
  const [loading, setLoading] = useState<boolean>(false);

  const filtered = useMemo(() => {
    switch (filter) {
      case "NEW":
        return projects.filter((p) => p.status === "recent");
      case "IN_PROGRESS":
        return projects.filter((p) => p.status === "in_progress");
      case "COMPLETED":
        return projects.filter((p) => p.status === "completed");
      case "APPROVED":
        return projects.filter((p) => p.status === "approved");
      case "REJECTED":
        return projects.filter((p) => p.status === "rejected");
      default:
        return projects;
    }
  }, [filter, projects]);

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
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{getFilterLabel(filter)}</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {filtered.length} project{filtered.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-4 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-sm">No projects found.</div>
            <div className="text-xs text-gray-400 mt-1">
              Projects will appear here when assigned to you.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((project) => (
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
    </Card>
  );
}
