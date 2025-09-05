"use client";

import { Card, CardContent } from "@/ui/components/card";
import { Badge } from "@/ui/components/badge";
import { cn } from "@/core/utils/utils";
import { useSkills } from "./use-skills";

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
  };
  isSelected: boolean;
  onClick: () => void;
}

export default function ProjectCard({ project, isSelected, onClick }: ProjectCardProps) {
  const { getSkillName } = useSkills();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress":
        return "bg-green-600 text-white";
      case "completed":
        return "bg-purple-600 text-white";
      case "recent":
        return "bg-blue-600 text-white";
      case "approved":
        return "bg-green-600 text-white";
      case "rejected":
        return "bg-red-600 text-white";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  const formatBudget = (budget: number | null | undefined, currency: string | null | undefined) => {
    if (typeof budget !== "number" || !currency) return null;
    return `${currency} ${budget.toLocaleString()}`;
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md",
        isSelected 
          ? "ring-2 ring-blue-500 shadow-md" 
          : "hover:shadow-sm"
      )}
      onClick={onClick}
      data-project-card
    >
      <CardContent className="p-3 sm:p-4">
        <div className="space-y-2 sm:space-y-3">
          {/* Header with title and status */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm sm:text-base text-gray-900 line-clamp-2 leading-tight">
              {project.name}
            </h3>
            <Badge className={cn("text-xs shrink-0", getStatusColor(project.status))}>
              {project.status.replace("_", " ")}
            </Badge>
          </div>

          {/* Description */}
          {project.description && (
            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 leading-relaxed">
              {project.description}
            </p>
          )}

          {/* Budget */}
          {formatBudget(project.budget, project.currency) && (
            <div className="text-sm sm:text-base font-medium text-green-600">
              {formatBudget(project.budget, project.currency)}
            </div>
          )}

          {/* Skills */}
          {Array.isArray(project.skills) && project.skills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {project.skills.slice(0, 3).map((skillId, index) => (
                <span 
                  key={index}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                >
                  {getSkillName(skillId)}
                </span>
              ))}
              {project.skills.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{project.skills.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Date */}
          <div className="text-xs sm:text-sm text-gray-500">
            {project.date}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
