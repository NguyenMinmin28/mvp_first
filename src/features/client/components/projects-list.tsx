"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Badge } from "@/ui/components/badge";
// import { Checkbox } from "@/ui/components/checkbox";
import { 
  FolderOpen, 
  Users, 
  DollarSign, 
  Clock,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";

interface Project {
  id: number;
  title: string;
  description: string;
  status: string;
  budget: string;
  applicants: number;
  hired: number;
  deadline: string;
  isCompleted: boolean;
}

export default function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: 1,
      title: "E-commerce Website",
      description: "Full-stack e-commerce platform with payment integration",
      status: "in_progress",
      budget: "$5,000",
      applicants: 12,
      hired: 2,
      deadline: "2024-02-15",
      isCompleted: false
    },
    {
      id: 2,
      title: "Mobile App Development",
      description: "React Native app for food delivery service",
      status: "completed",
      budget: "$8,000",
      applicants: 8,
      hired: 1,
      deadline: "2024-01-30",
      isCompleted: true
    },
    {
      id: 3,
      title: "AI Chatbot Integration",
      description: "Integrate AI chatbot into existing customer support system",
      status: "assigning",
      budget: "$3,500",
      applicants: 15,
      hired: 0,
      deadline: "2024-03-01",
      isCompleted: false
    }
  ]);

  const handleCompleteToggle = async (projectId: number, isCompleted: boolean) => {
    try {
      // Update local state immediately for better UX
      setProjects(prev => prev.map(project => 
        project.id === projectId 
          ? { ...project, isCompleted: !isCompleted }
          : project
      ));

      // Call API to update project completion status
      const response = await fetch(`/api/projects/${projectId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isCompleted: !isCompleted }),
      });

      if (!response.ok) {
        // Revert local state if API call fails
        setProjects(prev => prev.map(project => 
          project.id === projectId 
            ? { ...project, isCompleted: isCompleted }
            : project
        ));
        throw new Error('Failed to update project status');
      }

      toast.success(
        isCompleted 
          ? "Project marked as incomplete" 
          : "Project marked as complete!"
      );
    } catch (error) {
      console.error('Error updating project completion:', error);
      toast.error("Failed to update project status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "assigning": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "draft":
        return "Draft";
      case "submitted":
        return "Pending Review";
      case "assigning":
        return "Searching Developers";
      case "accepted":
        return "Developer Assigned";
      case "in_progress":
        return "Work in Progress";
      case "completed":
        return "Completed";
      case "canceled":
        return "Cancelled";
      default:
        return status;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>My Projects</CardTitle>
            <CardDescription>Manage your active and completed projects</CardDescription>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects.map((project) => (
            <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold">{project.title}</h3>
                  <Badge className={getStatusColor(project.status)}>
                    {getStatusText(project.status)}
                  </Badge>
                  {project.isCompleted && (
                    <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Complete
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{project.description}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {project.budget}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {project.applicants} applicants
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Due {project.deadline}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                                {/* Complete Button */}
                <Button
                  variant={project.isCompleted ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCompleteToggle(project.id, project.isCompleted)}
                  className={project.isCompleted ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {project.isCompleted ? "Completed" : "Mark Complete"}
                </Button>
                
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
