"use client";

import { Button } from "@/ui/components/button";
import { 
  DollarSign, 
  Users, 
  FileText
} from "lucide-react";
import { useSkills } from "./use-skills";
import { CountdownTimer } from "./countdown-timer";

interface ProjectDetailProps {
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
    // Assignment information
    assignment?: {
      id: string;
      acceptanceDeadline: string;
      responseStatus: "pending" | "accepted" | "rejected" | "expired";
      assignedAt: string;
      batchId: string;
    };
    // Additional detailed fields
    client?: {
      name: string;
      rating?: number;
      location?: string;
    };
    timeline?: {
      startDate: string;
      endDate: string;
      duration: string;
    };
    requirements?: string[];
    deliverables?: string[];
    communication?: {
      preferredMethod: string;
      frequency: string;
    };
  } | null;
  onApprove?: (projectId: string) => void;
  onReject?: (projectId: string) => void;
  onExpired?: (projectId: string) => void;
  onAcceptAssignment?: (projectId: string) => void;
  onRejectAssignment?: (projectId: string) => void;
}

export default function ProjectDetail({ project, onApprove, onReject, onExpired, onAcceptAssignment, onRejectAssignment }: ProjectDetailProps) {
  const { getSkillName } = useSkills();

  if (!project) {
    return (
      <div className="h-full border border-gray-200 bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="text-center">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <h3 className="text-base font-medium mb-2 text-gray-600">Select a Project</h3>
            <p className="text-sm text-gray-500">Choose a project from the list to view details</p>
          </div>
        </div>
      </div>
    );
  }

  const formatBudget = (budget: number | null | undefined, currency: string | null | undefined) => {
    if (typeof budget !== "number" || !currency) return "Not specified";
    return `${currency} ${budget.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      in_progress: 'bg-green-100 text-green-800 border-green-300',
      completed: 'bg-purple-100 text-purple-800 border-purple-300',
      recent: 'bg-blue-100 text-blue-800 border-blue-300',
      approved: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <div className="h-full border border-gray-200 rounded-xl flex flex-col bg-white shadow-lg">
      <div className="border-b border-gray-200 bg-gray-50 p-5">
        <div className="flex flex-col gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              {project.name}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={`px-4 py-2 text-xs font-medium rounded-lg border ${getStatusColor(project.status)}`}>
                {project.status.replace("_", " ")}
              </span>
              {project.client && (
                <span className="px-4 py-2 text-xs font-medium rounded-lg border border-gray-300 bg-gray-100 text-gray-700">
                  {project.client.name}
                </span>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-200">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">Contact:</span>
                <span className="text-sm text-gray-700">{project.client?.name || "Unknown"}</span>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-900">Budget:</span>
                <span className="text-sm text-gray-700 font-medium">
                  {formatBudget(project.budget, project.currency)}
                </span>
              </div>
            </div>
          </div>
          
          {(project.status === "recent" || (project.assignment && project.assignment.responseStatus === "pending")) && (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => {
                  if (project.assignment && project.assignment.responseStatus === "pending") {
                    if (onAcceptAssignment) {
                      onAcceptAssignment(project.id);
                    }
                  } else {
                    if (onApprove) {
                      onApprove(project.id);
                    }
                  }
                }}
              >
                {project.assignment && project.assignment.responseStatus === "pending" ? "Accept" : "Approve"}
              </Button>
              <Button 
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-300"
                onClick={() => {
                  if (project.assignment && project.assignment.responseStatus === "pending") {
                    if (onRejectAssignment) {
                      onRejectAssignment(project.id);
                    }
                  } else {
                    if (onReject) {
                      onReject(project.id);
                    }
                  }
                }}
              >
                {project.assignment && project.assignment.responseStatus === "pending" ? "Reject" : "Reject"}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6 flex-1 overflow-y-auto bg-white">
        {project.assignment && project.assignment.responseStatus === "pending" && (
          <div className="border border-orange-200 bg-orange-50 p-5 rounded-xl shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-semibold mb-2 text-orange-900">Assignment Deadline</h4>
                <p className="text-sm text-orange-800">
                  You have been assigned to this project. Use the Approve/Reject buttons above to respond.
                </p>
              </div>
              <CountdownTimer
                deadline={project.assignment.acceptanceDeadline}
                onExpired={() => {
                  if (onExpired) {
                    onExpired(project.id);
                  }
                }}
              />
            </div>
          </div>
        )}

        <hr className="border-gray-200" />

        {Array.isArray(project.skills) && project.skills.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-gray-900">Skills</h4>
            <div className="flex flex-wrap gap-2">
              {project.skills.map((skill, index) => {
                const skillIdOrName = String(skill || '');
                // Check if it's an ID (long hex string) or already a name
                const skillName = skillIdOrName.length > 20 || skillIdOrName.match(/^[a-f0-9]{24}$/i)
                  ? getSkillName(skillIdOrName)
                  : skillIdOrName;
                return (
                  <span key={index} className="px-4 py-2 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 transition-all duration-200">
                    {skillName}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {project.description && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-gray-900">Description</h4>
            <p className="text-sm leading-relaxed text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-200">
              {project.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
