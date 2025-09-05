"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/components/dialog";
import { Button } from "@/ui/components/button";
import { Card, CardContent } from "@/ui/components/card";
import { Badge } from "@/ui/components/badge";
import ReviewSlideModal from "@/features/client/components/review-slide-modal";

interface ReviewableProject {
  id: string;
  title: string;
  description: string;
  completedAt: string;
  assignedAt: string;
  respondedAt: string;
}

interface DeveloperReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  developerId: string;
  developerName: string;
  onReviewSubmitted?: () => void;
}

export default function DeveloperReviewModal({
  isOpen,
  onClose,
  developerId,
  developerName,
  onReviewSubmitted
}: DeveloperReviewModalProps) {
  const [projects, setProjects] = useState<ReviewableProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<ReviewableProject | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [developerImage, setDeveloperImage] = useState<string | undefined>(undefined);

  // Fetch reviewable projects and developer image when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchReviewableProjects();
      fetchDeveloperImage();
    }
  }, [isOpen, developerId]);

  const fetchReviewableProjects = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/developer/${developerId}/reviewable-projects`, {
        cache: "no-store"
      });
      
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      } else {
        console.error("Failed to fetch reviewable projects");
        setProjects([]);
      }
    } catch (error) {
      console.error("Error fetching reviewable projects:", error);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDeveloperImage = async () => {
    try {
      const response = await fetch(`/api/developer/${developerId}`, {
        cache: "no-store"
      });
      
      if (response.ok) {
        const data = await response.json();
        setDeveloperImage(data.developer?.photoUrl || data.developer?.user?.image);
      }
    } catch (error) {
      console.error("Error fetching developer image:", error);
    }
  };

  const handleProjectSelect = (project: ReviewableProject) => {
    setSelectedProject(project);
    setShowReviewForm(true);
  };

  const handleReviewSubmit = async (reviewData: any, developerId: string) => {
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: selectedProject?.id,
          developerId: developerId,
          rating: reviewData.rating,
          comment: reviewData.comment,
          deliveryOnTime: reviewData.deliveryOnTime
        }),
      });

      if (response.ok) {
        // Close the review form and refresh projects
        setShowReviewForm(false);
        setSelectedProject(null);
        fetchReviewableProjects();
        // Notify parent component that review was submitted
        if (onReviewSubmitted) {
          onReviewSubmitted();
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error; // Re-throw so ReviewSlideModal can handle it
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (showReviewForm && selectedProject) {
    return (
      <ReviewSlideModal
        isOpen={showReviewForm}
        onClose={() => {
          setShowReviewForm(false);
          setSelectedProject(null);
        }}
        project={{
          id: selectedProject.id,
          title: selectedProject.title
        }}
        developers={[{
          id: developerId,
          name: developerName,
          image: developerImage
        }]}
        onSubmit={handleReviewSubmit}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Review {developerName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading projects...</div>
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="text-gray-500 mb-2">No projects available for review</div>
              <div className="text-sm text-gray-400">
                You can only review developers for completed projects you worked on together.
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Select a completed project to review {developerName}:
              </div>
              
              {projects.map((project) => (
                <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-2 truncate">
                          {project.title}
                        </h3>
                        {project.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {project.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Completed: {formatDate(project.completedAt)}</span>
                          <span>Assigned: {formatDate(project.assignedAt)}</span>
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col items-end gap-2">
                        <Badge variant="secondary" className="text-xs">
                          Completed
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => handleProjectSelect(project)}
                          className="text-xs"
                        >
                          Review
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
