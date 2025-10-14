"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/components/dialog";
import { Button } from "@/ui/components/button";
import { Badge } from "@/ui/components/badge";
import { Card, CardContent } from "@/ui/components/card";
import { 
  FolderOpen, 
  DollarSign, 
  Calendar, 
  User, 
  MapPin, 
  Clock,
  X
} from "lucide-react";
import { toast } from "sonner";

interface Project {
  id: string;
  title: string;
  description: string;
  budget?: number;
  currency?: string;
  status: string;
  createdAt: string;
  skillsRequired?: string[];
  client?: {
    name: string;
    companyName?: string;
  };
}

interface ProjectReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle?: string;
}

export default function ProjectReferenceModal({ 
  isOpen, 
  onClose, 
  projectId, 
  projectTitle 
}: ProjectReferenceModalProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && projectId) {
      fetchProjectDetails();
    }
  }, [isOpen, projectId]);

  const fetchProjectDetails = async () => {
    setLoading(true);
    console.log('🔍 Modal - Fetching project details for ID:', projectId);
    try {
      const response = await fetch(`/api/developer/projects/${projectId}`);
      console.log('🔍 Modal - API response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Modal - API response data:', data);
        setProject(data.project);
      } else {
        const errorText = await response.text();
        console.error('❌ Modal - API error:', response.status, errorText);
        toast.error("Failed to load project details");
      }
    } catch (error) {
      console.error("Error fetching project details:", error);
      toast.error("Something went wrong while loading project details");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Project Reference
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Loading project details...</span>
          </div>
        ) : project ? (
          <div className="space-y-6">
            {/* Project Header */}
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">
                {project.title}
              </h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  {project.status}
                </Badge>
                <span className="text-sm text-gray-500">
                  Created {formatDate(project.createdAt)}
                </span>
              </div>
            </div>

            {/* Project Description */}
            {project.description && (
              <div className="space-y-2">
                <h3 className="font-medium text-gray-900">Description</h3>
                <p className="text-gray-700 leading-relaxed">
                  {project.description}
                </p>
              </div>
            )}

            {/* Project Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Budget */}
              {project.budget && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Budget</p>
                        <p className="font-semibold text-green-600">
                          {formatCurrency(project.budget, project.currency)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Client */}
              {project.client && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Client</p>
                        <p className="font-semibold text-gray-900">
                          {project.client.name}
                        </p>
                        {project.client.companyName && (
                          <p className="text-sm text-gray-500">
                            {project.client.companyName}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Created Date */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Created</p>
                      <p className="font-semibold text-gray-900">
                        {formatDate(project.createdAt)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <Badge 
                        variant="outline" 
                        className={
                          project.status === 'active' ? 'bg-green-100 text-green-800' :
                          project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }
                      >
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Skills Required */}
            {project.skillsRequired && project.skillsRequired.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {project.skillsRequired.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="bg-gray-100 text-gray-700">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end pt-4 border-t">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Project not found</p>
            <p className="text-sm text-gray-400 mt-1">
              The referenced project may have been deleted or is no longer available.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
