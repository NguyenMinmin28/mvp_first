"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ImageWithShimmer } from "@/ui/components/image-with-shimmer";

interface ServiceImageGalleryProps {
  coverUrl?: string | null;
  title: string;
  className?: string;
  images?: string[]; // Allow passing multiple images
  animationType?: "slide" | "fade"; // Animation type option
}

export function ServiceImageGallery({
  coverUrl,
  title,
  className = "",
  images: propImages,
  animationType = "slide",
}: ServiceImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Use provided images or fallback to coverUrl
  const images =
    propImages && propImages.length > 0
      ? propImages
      : coverUrl
        ? [coverUrl]
        : [];

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const handleDotClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTransitioning || index === currentImageIndex) return;
    setIsTransitioning(true);
    setCurrentImageIndex(index);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Image Container */}
      <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden group">
        {images.length > 0 ? (
          <div className="relative w-full h-full">
            {images.map((image, index) => (
              <ImageWithShimmer
                key={index}
                src={image}
                alt={`${title} ${index + 1}`}
                fill
                className={`object-cover transition-all duration-500 ease-in-out ${
                  animationType === "slide"
                    ? index === currentImageIndex
                      ? "translate-x-0 opacity-100"
                      : index < currentImageIndex
                        ? "-translate-x-full opacity-0"
                        : "translate-x-full opacity-0"
                    : index === currentImageIndex
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-105"
                }`}
                sizes="(max-width: 640px) 100vw, 50vw"
                shimmerSize="card"
              />
            ))}
          </div>
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-xs">No Image</span>
          </div>
        )}

        {/* Navigation Arrows - only show if multiple images */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Round Dots Navigation - only show if multiple images */}
      {images.length > 1 && (
        <div className="flex justify-center gap-1 mt-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={(e) => handleDotClick(index, e)}
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                currentImageIndex === index
                  ? "bg-gray-800"
                  : "bg-gray-300 hover:bg-gray-500"
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ServiceImageGallery;
