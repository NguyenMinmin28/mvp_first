"use client";

import { useState } from "react";
import Image from "next/image";

interface ServiceImageGalleryProps {
  coverUrl?: string | null;
  title: string;
  className?: string;
}

export function ServiceImageGallery({ coverUrl, title, className = "" }: ServiceImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Use service cover image or fallback to a single placeholder
  const images = coverUrl ? [coverUrl] : [];

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Image */}
      <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden mb-2">
        {images.length > 0 && images[currentImageIndex] ? (
          <Image
            src={images[currentImageIndex]}
            alt={title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-xs">No Image</span>
          </div>
        )}
      </div>

      {/* Thumbnail Strip - only show if we have multiple images */}
      {images.length > 1 && (
        <div className="flex gap-1">
          {images.slice(0, 4).map((image, index) => (
            <button
              key={index}
              onClick={() => handleImageClick(index)}
              className={`relative w-8 h-8 rounded overflow-hidden flex-shrink-0 ${
                currentImageIndex === index 
                  ? 'ring-2 ring-blue-500' 
                  : 'hover:opacity-80'
              }`}
            >
              <Image
                src={image}
                alt={`${title} thumbnail ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ServiceImageGallery;
