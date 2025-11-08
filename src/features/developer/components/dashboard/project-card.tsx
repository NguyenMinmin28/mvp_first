"use client";

import { Card, CardContent } from "@/ui/components/card";
import { Badge } from "@/ui/components/badge";
import { cn } from "@/core/utils/utils";
import { useSkills } from "./use-skills";
import { MessageCircle } from "lucide-react";

interface ProjectCardProps {
  project: {
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
  };
  isSelected: boolean;
  onClick: () => void;
}

export default function ProjectCard({ project, isSelected, onClick }: ProjectCardProps) {
  const { getSkillName } = useSkills();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress":
        return "bg-green-100 text-green-800 border-green-300";
      case "completed":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "recent":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "approved":
        return "bg-green-100 text-green-800 border-green-300";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const formatBudget = (budget: number | null | undefined, currency: string | null | undefined) => {
    if (typeof budget !== "number" || !currency) return null;
    return `${currency} ${budget.toLocaleString()}`;
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-300 border-2",
        isSelected 
          ? "ring-2 ring-blue-500 border-blue-400 shadow-xl bg-blue-50" 
          : "border-gray-200 hover:border-blue-300 hover:shadow-lg hover:bg-blue-50/50 bg-white"
      )}
      onClick={onClick}
      data-project-card
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with title and status */}
          <div className="flex items-start justify-between gap-2">
            <h3 className={cn(
              "font-semibold text-sm sm:text-base line-clamp-2 leading-tight transition-colors",
              isSelected ? "text-blue-900" : "text-gray-900"
            )}>
              {project.name}
            </h3>
            <span className={cn("text-xs shrink-0 px-3 py-1.5 rounded-lg border font-medium", getStatusColor(project.status))}>
              {project.status.replace("_", " ")}
            </span>
          </div>

          {/* Description */}
          {project.description && (
            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 leading-relaxed">
              {project.description}
            </p>
          )}

          {/* Budget */}
          {project.budget && project.currency && (
            <div className="flex items-center gap-1.5 text-sm sm:text-base font-semibold text-green-600">
              <span className="text-green-500">$</span>
              {formatBudget(project.budget, project.currency)}
            </div>
          )}

          {/* Skills */}
          {Array.isArray(project.skills) && project.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {project.skills.slice(0, 3).map((skill, index) => {
                const skillIdOrName = String(skill || '');
                // Check if it's an ID (long hex string) or already a name
                const skillName = skillIdOrName.length > 20 || skillIdOrName.match(/^[a-f0-9]{24}$/i)
                  ? getSkillName(skillIdOrName)
                  : skillIdOrName;
                return (
                  <span 
                    key={index}
                    className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-200 hover:bg-blue-100 transition-all duration-200"
                  >
                    {skillName}
                  </span>
                );
              })}
              {project.skills.length > 3 && (
                <span className="text-xs text-gray-500 px-2.5 py-1">
                  +{project.skills.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Date */}
          <div className="text-xs sm:text-sm text-gray-500">
            {new Date(project.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
