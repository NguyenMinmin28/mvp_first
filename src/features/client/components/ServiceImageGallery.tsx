"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ServiceImageGalleryProps {
  coverUrl?: string | null;
  title: string;
  className?: string;
  images?: string[]; // Allow passing multiple images
  animationType?: "slide" | "fade"; // Animation type option
  autoSlide?: boolean; // Enable auto-slide
  autoSlideInterval?: number; // Auto-slide interval in milliseconds
  showOverlay?: boolean; // Enable hover overlay
}

export function ServiceImageGallery({
  coverUrl,
  title,
  className = "",
  images: propImages,
  animationType = "slide",
  autoSlide = true,
  autoSlideInterval = 3000,
  showOverlay = true,
}: ServiceImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showImageOverlay, setShowImageOverlay] = useState(false);
  const [isOverlayHovered, setIsOverlayHovered] = useState(false);
  const [isNavigationHovered, setIsNavigationHovered] = useState(false);

  // Use provided images or fallback to coverUrl
  const images =
    propImages && propImages.length > 0
      ? propImages
      : coverUrl
        ? [coverUrl]
        : [];

  // Auto-slide functionality
  useEffect(() => {
    if (!autoSlide || images.length <= 1 || isHovered || isNavigationHovered) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, autoSlideInterval);

    return () => clearInterval(interval);
  }, [autoSlide, images.length, autoSlideInterval, isHovered, isNavigationHovered]);

  // Overlay functionality
  useEffect(() => {
    if (!showOverlay) return;

    let showTimeoutId: ReturnType<typeof setTimeout> | undefined;
    let hideTimeoutId: ReturnType<typeof setTimeout> | undefined;
    
    // Only show overlay if hovering the main container but not the navigation buttons
    if ((isHovered || isOverlayHovered) && !isNavigationHovered) {
      // Clear any pending hide timeout
      if (hideTimeoutId) clearTimeout(hideTimeoutId);
      // Show overlay after a short delay
      showTimeoutId = setTimeout(() => {
        console.log('Showing image overlay for:', title);
        setShowImageOverlay(true);
      }, 500);
    } else {
      // Clear any pending show timeout
      if (showTimeoutId) clearTimeout(showTimeoutId);
      // Hide overlay after a delay to prevent flickering
      hideTimeoutId = setTimeout(() => {
        console.log('Hiding image overlay for:', title);
        setShowImageOverlay(false);
      }, 300);
    }

    return () => {
      if (showTimeoutId) clearTimeout(showTimeoutId);
      if (hideTimeoutId) clearTimeout(hideTimeoutId);
    };
  }, [isHovered, isOverlayHovered, isNavigationHovered, showOverlay, title]);

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
      {/* Image Overlay */}
      {showOverlay && showImageOverlay && images.length > 0 && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm transition-opacity duration-300"
          style={{ zIndex: 9999 }}
          onClick={() => setShowImageOverlay(false)}
          onMouseEnter={() => setIsOverlayHovered(true)}
          onMouseLeave={() => setIsOverlayHovered(false)}
        >
          <div 
            className="relative max-w-5xl max-h-[95vh] mx-4 p-4"
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={() => setIsOverlayHovered(true)}
            onMouseLeave={() => setIsOverlayHovered(false)}
          >
            <Image
              src={images[currentImageIndex]}
              alt={`${title} - Full size`}
              width={1000}
              height={800}
              className="rounded-xl shadow-2xl object-contain max-w-full max-h-full"
              priority
            />
            <button
              onClick={() => setShowImageOverlay(false)}
              className="absolute top-2 right-2 w-12 h-12 bg-black/70 hover:bg-black/90 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-4 h-4 rounded-full transition-all duration-200 hover:scale-125 ${
                      currentImageIndex === index ? "bg-white shadow-lg" : "bg-white/50 hover:bg-white/70"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Image Container */}
      <div 
        className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden group cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => {
          if (showOverlay && images.length > 0) {
            setShowImageOverlay(true);
          }
        }}
      >
        {images.length > 0 ? (
          <div className="relative w-full h-full">
            {images.map((image, index) => (
              <Image
                key={index}
                src={image}
                alt={`${title} ${index + 1}`}
                fill
                className={`absolute inset-0 object-cover transition-all duration-500 ease-in-out ${
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
              onMouseEnter={() => setIsNavigationHovered(true)}
              onMouseLeave={() => setIsNavigationHovered(false)}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              onMouseEnter={() => setIsNavigationHovered(true)}
              onMouseLeave={() => setIsNavigationHovered(false)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Hover hint for overlay */}
        {showOverlay && images.length > 0 && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
              <span>Click to enlarge</span>
            </div>
          </div>
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
