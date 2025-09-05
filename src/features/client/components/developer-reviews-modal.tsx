"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/components/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/components/avatar";
import { Star } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  fromUser: {
    id: string;
    name: string;
    image?: string;
  };
  project: {
    id: string;
    title: string;
  };
}

interface DeveloperReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  developerId: string;
  developerName: string;
}

export default function DeveloperReviewsModal({
  isOpen,
  onClose,
  developerId,
  developerName
}: DeveloperReviewsModalProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch reviews when modal opens
  useEffect(() => {
    if (isOpen && developerId) {
      fetchReviews();
    }
  }, [isOpen, developerId]);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/developer/${developerId}/reviews`, {
        cache: "no-store"
      });
      
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
        setAverageRating(data.averageRating || 0);
        setTotalReviews(data.totalReviews || 0);
      } else {
        console.error("Failed to fetch reviews");
        setReviews([]);
        setAverageRating(0);
        setTotalReviews(0);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setReviews([]);
      setAverageRating(0);
      setTotalReviews(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to render star rating
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(<Star key="half" className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }
    
    return stars;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Reviews for {developerName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading reviews...</div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="text-gray-500 mb-2">No reviews yet</div>
              <div className="text-sm text-gray-400">
                This developer hasn't received any reviews yet.
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {renderStars(averageRating)}
                    </div>
                    <span className="text-lg font-semibold">
                      {averageRating.toFixed(1)}
                    </span>
                  </div>
                  <div className="text-gray-600">
                    Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={review.fromUser.image || undefined} />
                        <AvatarFallback>
                          {review.fromUser.name?.slice(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-sm">
                            {review.fromUser.name || 'Anonymous'}
                          </span>
                          <div className="flex items-center">
                            {renderStars(review.rating)}
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(review.createdAt)}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-2">
                          Project: {review.project.title}
                        </div>
                        
                        {review.comment && (
                          <div className="text-sm text-gray-700">
                            {review.comment}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
