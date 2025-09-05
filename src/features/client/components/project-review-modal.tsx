"use client";

import { useState } from "react";
import { Button } from "@/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Textarea } from "@/ui/components/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/components/avatar";
import { Star, ChevronLeft, ChevronRight, SkipForward, X } from "lucide-react";
import { toast } from "sonner";

interface DeveloperToReview {
  id: string;
  name: string;
  image?: string;
}

interface ProjectReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
  developers: DeveloperToReview[];
  onComplete: () => void;
}

export function ProjectReviewModal({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  developers,
  onComplete,
}: ProjectReviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviews, setReviews] = useState<Record<string, { rating: number; comment: string; deliveryOnTime: boolean | null; skipped?: boolean }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentDeveloper = developers[currentIndex];
  
  const currentReview = reviews[currentDeveloper?.id] || {
    rating: 0,
    comment: "",
    deliveryOnTime: null
  };

  const handleRatingChange = (rating: number) => {
    if (currentDeveloper) {
      setReviews(prev => ({
        ...prev,
        [currentDeveloper.id]: { ...prev[currentDeveloper.id], rating }
      }));
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (currentDeveloper) {
      setReviews(prev => ({
        ...prev,
        [currentDeveloper.id]: { ...prev[currentDeveloper.id], comment: e.target.value }
      }));
    }
  };

  const handleDeliveryChange = (value: string) => {
    if (currentDeveloper) {
      setReviews(prev => ({
        ...prev,
        [currentDeveloper.id]: { ...prev[currentDeveloper.id], deliveryOnTime: value === "yes" }
      }));
    }
  };

  const handleNext = () => {
    if (currentIndex < developers.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // All developers reviewed, submit all
      handleSubmitAllReviews();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    if (currentDeveloper) {
      // Mark as skipped or simply move to next without saving review
      setReviews(prev => ({
        ...prev,
        [currentDeveloper.id]: { ...prev[currentDeveloper.id], skipped: true }
      }));
    }
    handleNext();
  };

  const handleSubmitAllReviews = async () => {
    setIsSubmitting(true);
    try {
      const reviewsToSubmit = Object.entries(reviews)
        .filter(([, review]) => !review.skipped) // Only submit non-skipped reviews
        .map(([developerId, review]) => ({
          projectId,
          developerId,
          rating: review.rating,
          comment: review.comment,
          deliveryOnTime: review.deliveryOnTime,
        }));

      if (reviewsToSubmit.length === 0 && developers.length > 0) {
        // If all developers were skipped, just complete the project without reviews
        toast.info("All developers skipped. Completing project without reviews.");
        onComplete();
        return;
      }

      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reviews: reviewsToSubmit }),
      });

      if (response.ok) {
        toast.success("Reviews submitted successfully!");
        onComplete();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to submit reviews");
      }
    } catch (error) {
      console.error("Error submitting reviews:", error);
      toast.error("An error occurred while submitting reviews");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentDeveloper) {
    return null; // Should not happen if developers array is not empty
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div>
              <CardTitle className="text-lg">Review Project: {projectTitle}</CardTitle>
              <p className="text-sm text-gray-600">Developer {currentIndex + 1} of {developers.length}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Developer Profile */}
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-20 w-20">
              <AvatarImage 
                src={currentDeveloper.image || undefined} 
                alt={currentDeveloper.name}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <AvatarFallback className="bg-gray-200 text-gray-600 text-lg font-semibold">
                {currentDeveloper.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h3 className="text-lg font-semibold">{currentDeveloper.name}</h3>
            </div>
          </div>

          {/* Rating */}
          <div className="space-y-3">
            <h5 className="font-medium">Rate Developer</h5>
            <div className="flex justify-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-6 w-6 cursor-pointer ${
                    star <= currentReview.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                  }`}
                  onClick={() => handleRatingChange(star)}
                />
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-3">
            <h5 className="font-medium">Add Review (optional)</h5>
            <Textarea
              placeholder="Share your experience with this developer..."
              value={currentReview.comment}
              onChange={handleCommentChange}
              rows={3}
            />
          </div>

          {/* Delivery On Time */}
          <div className="space-y-3">
            <h5 className="font-medium">Was the delivery on time?</h5>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="delivery"
                  checked={currentReview.deliveryOnTime === true}
                  onChange={() => handleDeliveryChange("yes")}
                  className="w-4 h-4"
                />
                <span>Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="delivery"
                  checked={currentReview.deliveryOnTime === false}
                  onChange={() => handleDeliveryChange("no")}
                  className="w-4 h-4"
                />
                <span>No</span>
              </label>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentIndex === 0 || isSubmitting}
            >
              <ChevronLeft className="h-4 w-4 mr-2" /> Previous
            </Button>
            <Button
              variant="ghost"
              onClick={handleSkip}
              disabled={isSubmitting}
            >
              <SkipForward className="h-4 w-4 mr-2" /> Skip
            </Button>
            <Button onClick={handleNext} disabled={isSubmitting}>
              {currentIndex < developers.length - 1 ? "Next" : "Submit All Reviews"}
              {currentIndex < developers.length - 1 ? <ChevronRight className="h-4 w-4 ml-2" /> : null}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}