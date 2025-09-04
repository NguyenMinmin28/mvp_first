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
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold text-gray-900 mb-2">
              {project.name}
            </CardTitle>
            <div className="flex items-center gap-2 mb-3">
              <Badge className={getStatusColor(project.status)}>
                {project.status.replace("_", " ")}
              </Badge>
              {project.assignmentStatus && (
                <Badge variant="secondary">
                  {project.assignmentStatus}
                </Badge>
              )}
            </div>
          </div>
          
          {/* Approve/Reject Buttons */}
          <div className="flex gap-2">
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
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
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
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
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Description */}
        {project.description && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Project Description
            </h4>
            <p className="text-gray-700 leading-relaxed">
              {project.description}
            </p>
          </div>
        )}

        {/* Assignment Timer */}
        {project.assignment && project.assignment.responseStatus === "pending" && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <div className="flex items-center justify-between">
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

        {/* Budget & Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <h4 className="font-semibold text-gray-900">Budget</h4>
            </div>
            <p className="text-lg font-bold text-green-600">
              {formatBudget(project.budget, project.currency)}
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h4 className="font-semibold text-gray-900">Posted</h4>
            </div>
            <p className="text-sm text-gray-700">{project.date}</p>
          </div>
        </div>

        {/* Client Information */}
        {project.client && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Client Information
            </h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{project.client.name}</span>
                {project.client.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm text-gray-600">{project.client.rating}</span>
                  </div>
                )}
              </div>
              {project.client.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  {project.client.location}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Skills Required */}
        {Array.isArray(project.skills) && project.skills.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Required Skills</h4>
            <div className="flex flex-wrap gap-2">
              {project.skills.map((skillId, index) => (
                <Badge key={index} variant="outline" className="text-sm">
                  {getSkillName(skillId)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Requirements */}
        {Array.isArray(project.requirements) && project.requirements.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Requirements</h4>
            <ul className="space-y-2">
              {project.requirements.map((req, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  {req}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Deliverables */}
        {Array.isArray(project.deliverables) && project.deliverables.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Deliverables</h4>
            <ul className="space-y-2">
              {project.deliverables.map((deliverable, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  {deliverable}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Communication Preferences */}
        {project.communication && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Communication
            </h4>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-gray-700">Method:</span>
                <span className="text-gray-600">{project.communication.preferredMethod}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-gray-700">Frequency:</span>
                <span className="text-gray-600">{project.communication.frequency}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          {project.status === "recent" && (
            <Button className="flex-1 bg-green-600 hover:bg-green-700">
              Accept Project
            </Button>
          )}
          {project.status === "in_progress" && (
            <Button variant="outline" className="flex-1">
              Update Progress
            </Button>
          )}
          <Button variant="outline" className="flex-1">
            View Messages
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
