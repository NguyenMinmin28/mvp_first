// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Badge } from "@/ui/components/badge";
import { Plus, Eye, RefreshCw, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import type { Prisma } from "@prisma/client";
type ProjectStatus = Prisma.$Enums.ProjectStatus;
type BatchStatus = Prisma.$Enums.BatchStatus;
type ResponseStatus = Prisma.$Enums.ResponseStatus;

interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  skillsRequired: string[];
  createdAt: Date;
  currentBatch?: {
    id: string;
    status: BatchStatus;
    candidates: Array<{
      id: string;
      responseStatus: ResponseStatus;
                        developer: {
                    user: {
                      name: string | null;
                      email: string | null;
                    };
                  };
    }>;
  } | null;
  _count: {
    assignmentBatches: number;
    assignmentCandidates: number;
  };
}

interface ProjectManagementPageProps {
  projects: Project[];
}

export function ProjectManagementPage({ projects }: ProjectManagementPageProps) {
  const [isRefreshing, setIsRefreshing] = useState<string | null>(null);

  const getStatusIcon = (status: ProjectStatus) => {
    switch (status) {
      case "submitted":
        return <Clock className="h-4 w-4" />;
      case "assigning":
        return <RefreshCw className="h-4 w-4" />;
      case "accepted":
        return <CheckCircle className="h-4 w-4" />;
      case "in_progress":
        return <CheckCircle className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "canceled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case "submitted":
        return "bg-yellow-100 text-yellow-800";
      case "assigning":
        return "bg-blue-100 text-blue-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-purple-100 text-purple-800";
      case "canceled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: ProjectStatus) => {
    switch (status) {
      case "submitted":
        return "Submitted";
      case "assigning":
        return "Finding Developers";
      case "accepted":
        return "Developer Assigned";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
      case "canceled":
        return "Cancelled";
      default:
        return status;
    }
  };

  const getCandidateStats = (project: Project) => {
    if (!project.currentBatch?.candidates) return { total: 0, accepted: 0, pending: 0, rejected: 0 };
    
    const candidates = project.currentBatch.candidates;
    return {
      total: candidates.length,
      accepted: candidates.filter(c => c.responseStatus === "accepted").length,
      pending: candidates.filter(c => c.responseStatus === "pending").length,
      rejected: candidates.filter(c => c.responseStatus === "rejected").length,
    };
  };

  const getDeveloperName = (developer: { user: { name: string | null; email: string | null } }) => {
    return developer.user.name || developer.user.email || "Unknown Developer";
  };

  const handleRefreshBatch = async (projectId: string) => {
    setIsRefreshing(projectId);
    try {
      const response = await fetch(`/api/projects/${projectId}/batches/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fresherCount: 5,
          midCount: 5,
          expertCount: 3,
        }),
      });

      if (response.ok) {
        // Use Next.js router to refresh the page data
        window.location.reload();
      } else {
        console.error("Failed to refresh batch");
        alert("Failed to refresh batch. Please try again.");
      }
    } catch (error) {
      console.error("Error refreshing batch:", error);
      alert("Error refreshing batch. Please try again.");
    } finally {
      setIsRefreshing(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* New Project Button */}
      <div className="flex justify-end">
        <Link href="/projects/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="mx-auto h-12 w-12 text-muted-foreground">
                <AlertCircle className="h-12 w-12" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No projects yet</h3>
                <p className="text-muted-foreground">
                  Create your first project to get started
                </p>
              </div>
              <Link href="/projects/new">
                <Button>Create Project</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const stats = getCandidateStats(project);
            const hasActiveBatch = project.currentBatch?.status === "active";
            
            return (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{project.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {project.description}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(project.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(project.status)}
                        {getStatusText(project.status)}
                      </div>
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Skills */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Required Skills</h4>
                    <div className="flex flex-wrap gap-1">
                      {project.skillsRequired.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {project.skillsRequired.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{project.skillsRequired.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Batches</p>
                      <p className="font-semibold">{project._count.assignmentBatches}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Candidates</p>
                      <p className="font-semibold">{project._count.assignmentCandidates}</p>
                    </div>
                  </div>

                  {/* Current Batch Stats */}
                  {hasActiveBatch && (
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <h4 className="text-sm font-medium mb-2">Current Batch</h4>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <p className="text-muted-foreground">Pending</p>
                          <p className="font-semibold text-yellow-600">{stats.pending}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">Accepted</p>
                          <p className="font-semibold text-green-600">{stats.accepted}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">Rejected</p>
                          <p className="font-semibold text-red-600">{stats.rejected}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link href={`/projects/${project.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                    
                    {hasActiveBatch && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleRefreshBatch(project.id)}
                        disabled={isRefreshing === project.id}
                      >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing === project.id ? 'animate-spin' : ''}`} />
                      </Button>
                    )}
                  </div>

                  {/* Created Date */}
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
