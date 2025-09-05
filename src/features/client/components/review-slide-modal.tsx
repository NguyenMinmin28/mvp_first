"use client";

import { useState } from "react";
import { Button } from "@/ui/components/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/components/avatar";
import { Star, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

interface ReviewSlideModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id: string;
    title: string;
  };
  developers: Array<{
    id: string;
    name: string;
    image?: string;
  }>;
  onSubmit: (reviewData: ReviewData, developerId: string) => Promise<void>;
}

interface ReviewData {
  rating: number;
  comment: string;
  deliveryOnTime: boolean;
}

export default function ReviewSlideModal({ 
  isOpen, 
  onClose, 
  project, 
  developers, 
  onSubmit 
}: ReviewSlideModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviews, setReviews] = useState<Record<string, ReviewData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentDeveloper = developers[currentIndex];
  const currentReview = reviews[currentDeveloper?.id] || {
    rating: 0,
    comment: "",
    deliveryOnTime: null as boolean | null
  };

  const handleRatingChange = (rating: number) => {
    if (currentDeveloper) {
      setReviews(prev => ({
        ...prev,
        [currentDeveloper.id]: {
          ...prev[currentDeveloper.id],
          rating
        }
      }));
    }
  };

  const handleCommentChange = (comment: string) => {
    if (currentDeveloper) {
      setReviews(prev => ({
        ...prev,
        [currentDeveloper.id]: {
          ...prev[currentDeveloper.id],
          comment
        }
      }));
    }
  };

  const handleDeliveryChange = (deliveryOnTime: boolean) => {
    if (currentDeveloper) {
      setReviews(prev => ({
        ...prev,
        [currentDeveloper.id]: {
          ...prev[currentDeveloper.id],
          deliveryOnTime
        }
      }));
    }
  };

  const handleNext = () => {
    if (currentIndex < developers.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (currentReview.rating === 0 || currentReview.deliveryOnTime === null) {
      alert("Please provide a rating and delivery status");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(currentReview, currentDeveloper.id);
      
      // Move to next developer or close modal
      if (currentIndex < developers.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // All reviews submitted
        setReviews({});
        setCurrentIndex(0);
        onClose();
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !currentDeveloper) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center">
      <div className="bg-white w-full max-w-md rounded-t-3xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="font-medium">Review Developers</span>
          <div className="w-9"></div> {/* Spacer for centering */}
        </div>

        {/* Progress indicator */}
        <div className="px-4 py-2 border-b">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Developer {currentIndex + 1} of {developers.length}</span>
            <div className="flex gap-1">
              {developers.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentIndex ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Project Details */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {project.title}
            </h2>
            <p className="text-gray-600">Project completed successfully</p>
          </div>

          {/* Developer Profile */}
          <div className="flex justify-center">
            <Avatar className="w-32 h-32 rounded-lg">
              <AvatarImage src={currentDeveloper.image || undefined} />
              <AvatarFallback className="bg-gray-200 text-gray-400 text-2xl">
                {currentDeveloper.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Developer Name */}
          <div className="text-center">
            <h3 className="text-xl font-semibold">{currentDeveloper.name}</h3>
          </div>

          {/* Rating Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Rate Developer</h3>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRatingChange(star)}
                  className="p-1"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= currentReview.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Review Text */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Add Review</h3>
            <textarea
              value={currentReview.comment}
              onChange={(e) => handleCommentChange(e.target.value)}
              placeholder="I am really happy to work with you"
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          {/* Delivery On Time */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Delivery On time:</h3>
            <div className="space-y-2">
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="deliveryOnTime"
                  checked={currentReview.deliveryOnTime === true}
                  onChange={() => handleDeliveryChange(true)}
                  className="w-4 h-4 text-blue-600"
                />
                <span>Yes</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="deliveryOnTime"
                  checked={currentReview.deliveryOnTime === false}
                  onChange={() => handleDeliveryChange(false)}
                  className="w-4 h-4 text-blue-600"
                />
                <span>No</span>
              </label>
            </div>
          </div>

          {/* Navigation and Submit */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || currentReview.rating === 0 || currentReview.deliveryOnTime === null}
              className="bg-black text-white px-6"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </div>
              ) : currentIndex === developers.length - 1 ? (
                "Submit All"
              ) : (
                "Next"
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleNext}
              disabled={currentIndex === developers.length - 1}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
