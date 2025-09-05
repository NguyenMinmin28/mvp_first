"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { 
  Calendar, 
  DollarSign, 
  MapPin, 
  Users, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Star,
  MessageSquare,
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
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full min-h-[400px]">
          <div className="text-center text-gray-500">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">Select a Project</h3>
            <p className="text-sm">Choose a project from the list to view details</p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
    if (typeof budget !== "number" || !currency) return "Not specified";
    return `${currency} ${budget.toLocaleString()}`;
  };

  return (
    <Card className="h-full">
      <CardHeader className="border-b p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
              {project.name}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge className={getStatusColor(project.status)}>
                {project.status.replace("_", " ")}
              </Badge>
              {project.client && (
                <Badge variant="secondary">
                  {project.client.name}
                </Badge>
              )}
            </div>
            
            {/* Contact & Budget Section - Responsive Layout */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-bold text-gray-700">Contact:</span>
                <span className="text-sm text-gray-900">{project.client?.name || "Unknown"}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-bold text-gray-700">Estimated budget:</span>
                <span className="text-sm text-gray-900">
                  {formatBudget(project.budget, project.currency)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Approve/Reject Buttons - Only show for pending/recent projects */}
          {(project.status === "recent" || (project.assignment && project.assignment.responseStatus === "pending")) && (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm sm:text-base"
                onClick={() => {
                  // If there's a pending assignment, use assignment logic
                  if (project.assignment && project.assignment.responseStatus === "pending") {
                    if (onAcceptAssignment) {
                      onAcceptAssignment(project.id);
                    }
                  } else {
                    // Otherwise use regular approve logic
                    if (onApprove) {
                      onApprove(project.id);
                    }
                  }
                }}
              >
                {project.assignment && project.assignment.responseStatus === "pending" ? "Accept" : "Approve"}
              </Button>
              <Button 
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm sm:text-base"
                onClick={() => {
                  // If there's a pending assignment, use assignment logic
                  if (project.assignment && project.assignment.responseStatus === "pending") {
                    if (onRejectAssignment) {
                      onRejectAssignment(project.id);
                    }
                  } else {
                    // Otherwise use regular reject logic
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
      </CardHeader>

      <CardContent className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Assignment Timer */}
        {project.assignment && project.assignment.responseStatus === "pending" && (
          <div className="bg-yellow-50 border border-yellow-200 p-3 sm:p-4 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Assignment Deadline</h4>
                <p className="text-sm text-gray-600">
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

        {/* Divider Line */}
        <hr className="border-gray-200" />

        {/* Skills Section */}
        {Array.isArray(project.skills) && project.skills.length > 0 && (
          <div className="space-y-2 sm:space-y-3">
            <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Skills</h4>
            <div className="flex flex-wrap gap-2">
              {project.skills.map((skillId, index) => (
                <Badge key={index} variant="outline" className="text-xs sm:text-sm" style={{ backgroundColor: '#FCEBE2' }}>
                  {getSkillName(skillId)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Description Section */}
        {project.description && (
          <div className="space-y-2 sm:space-y-3">
            <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Description</h4>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              {project.description}
            </p>
          </div>
        )}

        {/* Action Buttons */}
       
      </CardContent>
    </Card>
  );
}
