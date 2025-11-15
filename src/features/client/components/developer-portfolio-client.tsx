"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/components/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/components/avatar";
import { Badge } from "@/ui/components/badge";
import { Card, CardContent } from "@/ui/components/card";
import { ArrowLeft, Briefcase, ExternalLink, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/core/utils/utils";
import { useSession } from "next-auth/react";

interface Developer {
  id: string;
  name: string | null;
  image: string | null;
  level: string;
}

interface PortfolioItem {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  imageUrl: string;
  images: string[];
  createdAt: Date;
  userLiked: boolean;
  likeCount: number;
}

interface DeveloperPortfolioClientProps {
  developer: Developer;
  portfolioItems: PortfolioItem[];
}

export function DeveloperPortfolioClient({
  developer,
  portfolioItems,
}: DeveloperPortfolioClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [portfolioLikes, setPortfolioLikes] = useState<Record<string, { liked: boolean; count: number }>>(
    portfolioItems.reduce((acc, item) => ({
      ...acc,
      [item.id]: { liked: item.userLiked, count: item.likeCount }
    }), {})
  );

  const currentItem = portfolioItems[currentIndex] || null;

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? portfolioItems.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === portfolioItems.length - 1 ? 0 : prev + 1));
  };

  const handleLike = async (portfolioId: string) => {
    if (!session) {
      // Redirect to login
      router.push('/auth/signin');
      return;
    }

    const previousState = portfolioLikes[portfolioId];
    
    // Optimistic update
    setPortfolioLikes(prev => ({
      ...prev,
      [portfolioId]: {
        liked: !previousState.liked,
        count: previousState.liked ? previousState.count - 1 : previousState.count + 1,
      }
    }));

    try {
      const response = await fetch(`/api/portfolio/${portfolioId}/like`, {
        method: 'POST',
      });

      if (!response.ok) {
        // Revert on error
        setPortfolioLikes(prev => ({
          ...prev,
          [portfolioId]: previousState,
        }));
      } else {
        const data = await response.json();
        // Update with server response
        setPortfolioLikes(prev => ({
          ...prev,
          [portfolioId]: {
            liked: data.liked || false,
            count: data.likeCount || 0,
          }
        }));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert on error
      setPortfolioLikes(prev => ({
        ...prev,
        [portfolioId]: previousState,
      }));
    }
  };

  // Get all images from current portfolio
  const getCurrentImages = () => {
    if (!currentItem) return [];
    return currentItem.images.filter(img => img && img.trim() !== '');
  };

  const currentImages = getCurrentImages();
  const [imageIndex, setImageIndex] = useState(0);
  const currentImage = currentImages[imageIndex] || currentItem?.imageUrl || '';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.back();
                }}
                className="hover:bg-gray-100 cursor-pointer"
                type="button"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage 
                    src={developer.image || '/images/avata/default.jpeg'} 
                    className="object-cover"
                  />
                  <AvatarFallback>
                    {(developer.name || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">{developer.name}</h1>
                  <Badge 
                    className={cn(
                      "text-xs px-2 py-0.5 text-white font-semibold",
                      developer.level === 'EXPERT' 
                        ? 'bg-gradient-to-r from-gray-800 to-black' 
                        : developer.level === 'MID' 
                          ? 'bg-gradient-to-r from-gray-600 to-gray-700'
                          : 'bg-gradient-to-r from-gray-500 to-gray-600'
                    )}
                  >
                    {developer.level === 'EXPERT' ? 'TOP INDEPENDENT' : developer.level === 'MID' ? 'PRO' : 'STARTER'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {portfolioItems.length} {portfolioItems.length === 1 ? 'Project' : 'Projects'}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {portfolioItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Briefcase className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No portfolio items yet</h3>
            <p className="text-gray-600 text-center">
              This developer hasn't added any portfolio items yet.
            </p>
          </div>
        ) : (
          <>
            {/* Main Portfolio Display */}
            <div className="mb-8">
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Portfolio Image Carousel */}
                  <div className="relative aspect-video bg-gray-100 group">
                    {currentImage ? (
                      <img
                        src={currentImage}
                        alt={currentItem?.title || 'Portfolio'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Briefcase className="h-20 w-20 text-gray-400" />
                      </div>
                    )}

                    {/* Like Button */}
                    {currentItem && (
                      <button
                        onClick={() => handleLike(currentItem.id)}
                        className="absolute top-4 right-4 w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 z-20"
                      >
                        <Heart 
                          className={cn(
                            "w-6 h-6 transition-colors",
                            portfolioLikes[currentItem.id]?.liked
                              ? "fill-red-500 text-red-500"
                              : "text-gray-600 hover:text-red-400"
                          )}
                        />
                      </button>
                    )}

                    {/* Image Navigation for Multiple Images */}
                    {currentImages.length > 1 && (
                      <>
                        <button
                          onClick={() => setImageIndex((prev) => (prev === 0 ? currentImages.length - 1 : prev - 1))}
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
                        >
                          <ChevronLeft className="h-6 w-6 text-gray-700" />
                        </button>
                        <button
                          onClick={() => setImageIndex((prev) => (prev === currentImages.length - 1 ? 0 : prev + 1))}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
                        >
                          <ChevronRight className="h-6 w-6 text-gray-700" />
                        </button>

                        {/* Image Indicator */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                          {currentImages.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setImageIndex(idx)}
                              className={cn(
                                "h-2 rounded-full transition-all duration-200",
                                idx === imageIndex ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/75"
                              )}
                            />
                          ))}
                        </div>
                      </>
                    )}

                    {/* Overlay with Info */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-8">
                      {currentItem && (
                        <>
                          <h2 className="text-white text-3xl font-bold mb-3">
                            {currentItem.title || 'Untitled'}
                          </h2>
                          {currentItem.description && (
                            <p className="text-white/90 text-lg mb-4 line-clamp-2">
                              {currentItem.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4">
                            {currentItem.url && (
                              <Button
                                variant="default"
                                size="lg"
                                className="bg-white/90 hover:bg-white text-gray-900"
                                onClick={() => window.open(currentItem.url!, '_blank', 'noopener,noreferrer')}
                              >
                                <ExternalLink className="h-5 w-5 mr-2" />
                                View Project
                              </Button>
                            )}
                            <div className="flex items-center gap-2 text-white">
                              <Heart className="h-5 w-5" />
                              <span className="font-semibold">
                                {portfolioLikes[currentItem.id]?.count || 0} likes
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Portfolio Navigation */}
              {portfolioItems.length > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-5 w-5" />
                    Previous
                  </Button>
                  <div className="text-sm text-gray-600">
                    {currentIndex + 1} / {portfolioItems.length}
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleNext}
                    className="gap-2"
                  >
                    Next
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>

            {/* All Portfolio Grid */}
            <div className="mt-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">All Projects</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {portfolioItems.map((item, idx) => (
                  <Card
                    key={item.id}
                    className={cn(
                      "group cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl",
                      idx === currentIndex && "ring-2 ring-gray-900"
                    )}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setImageIndex(0);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <CardContent className="p-0">
                      {/* Portfolio Image */}
                      <div className="relative h-56 bg-gray-100">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Briefcase className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                          {item.title}
                        </h4>
                        {item.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                            {item.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Heart className="h-4 w-4" />
                          <span>{portfolioLikes[item.id]?.count || 0} likes</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

