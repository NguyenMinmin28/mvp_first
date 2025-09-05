"use client";

import { useState } from "react";
import { Button } from "@/ui/components/button";
import { Card, CardContent } from "@/ui/components/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/components/avatar";
import { Star, ArrowLeft, Check } from "lucide-react";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id: string;
    title: string;
  };
  developer: {
    id: string;
    name: string;
    image?: string;
  };
  onSubmit: (reviewData: ReviewData) => Promise<void>;
}

interface ReviewData {
  rating: number;
  comment: string;
  deliveryOnTime: boolean;
}

export default function ReviewModal({ 
  isOpen, 
  onClose, 
  project, 
  developer, 
  onSubmit 
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [deliveryOnTime, setDeliveryOnTime] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0 || deliveryOnTime === null) {
      alert("Please provide a rating and delivery status");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        rating,
        comment,
        deliveryOnTime
      });
      
      // Reset form
      setRating(0);
      setComment("");
      setDeliveryOnTime(null);
      onClose();
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center">
      <div className="bg-white w-full max-w-md rounded-t-3xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center p-4 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="ml-2 font-medium">Back</span>
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
              <AvatarImage src={developer.image || undefined} />
              <AvatarFallback className="bg-gray-200 text-gray-400 text-2xl">
                {developer.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Rating Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Rate Developer</h3>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= rating
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
              value={comment}
              onChange={(e) => setComment(e.target.value)}
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
                  checked={deliveryOnTime === true}
                  onChange={() => setDeliveryOnTime(true)}
                  className="w-4 h-4 text-blue-600"
                />
                <span>Yes</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="deliveryOnTime"
                  checked={deliveryOnTime === false}
                  onChange={() => setDeliveryOnTime(false)}
                  className="w-4 h-4 text-blue-600"
                />
                <span>No</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0 || deliveryOnTime === null}
            className="w-full bg-black text-white h-12 text-lg font-medium"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Submitting...
              </div>
            ) : (
              "Submit"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
