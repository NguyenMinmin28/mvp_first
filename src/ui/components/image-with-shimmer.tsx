"use client";

import { useState, useEffect, useRef } from "react";
import Image, { ImageProps } from "next/image";
import { SHIMMER_SIZES } from "@/core/utils/shimmer";
import { cn } from "@/core/utils/utils";

interface ImageWithShimmerProps extends Omit<ImageProps, "placeholder"> {
  /**
   * Aspect ratio to maintain (e.g., "16/9", "4/3", "1/1")
   * Prevents layout shift during image load
   */
  aspectRatio?: string;
  /**
   * Preset size for shimmer placeholder
   */
  shimmerSize?: keyof typeof SHIMMER_SIZES;
  /**
   * Custom shimmer dimensions
   */
  shimmerWidth?: number;
  shimmerHeight?: number;
  /**
   * Whether to show shimmer overlay during loading
   */
  showShimmerOverlay?: boolean;
  /**
   * Custom background color for shimmer overlay (default: bg-gray-200)
   */
  shimmerBgColor?: string;
  /**
   * Container className
   */
  containerClassName?: string;
}

/**
 * Image component with Uber-style shimmer loading effect
 * Automatically handles aspect ratio to prevent layout shift
 */
export function ImageWithShimmer({
  src,
  alt,
  width,
  height,
  fill,
  aspectRatio,
  shimmerSize,
  shimmerWidth,
  shimmerHeight,
  showShimmerOverlay = true,
  shimmerBgColor = "bg-gray-200",
  className,
  containerClassName,
  sizes,
  priority,
  onLoad,
  onError,
  ...props
}: ImageWithShimmerProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showShimmer, setShowShimmer] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Check if image is already loaded (e.g., cached images or when src changes)
  useEffect(() => {
    const checkImageLoaded = () => {
      if (containerRef.current) {
        // Next.js Image wraps in span, so we need to find the actual img
        const span = containerRef.current.querySelector('span');
        const img = span ? span.querySelector('img') : containerRef.current.querySelector('img');
        if (img && img.complete && img.naturalHeight !== 0) {
          setIsLoaded(true);
          setShowShimmer(false);
        }
      }
    };

    // Check immediately
    checkImageLoaded();
    
    // Also check after a short delay for cases where image loads very quickly
    const timeout = setTimeout(checkImageLoaded, 100);
    
    return () => clearTimeout(timeout);
  }, [src]);

  // Calculate shimmer dimensions
  const getShimmerDimensions = () => {
    if (shimmerSize && SHIMMER_SIZES[shimmerSize]) {
      return SHIMMER_SIZES[shimmerSize];
    }
    if (shimmerWidth && shimmerHeight) {
      return { w: shimmerWidth, h: shimmerHeight };
    }
    if (typeof width === "number" && typeof height === "number") {
      return { w: width, h: height };
    }
    // Default fallback
    return SHIMMER_SIZES.card;
  };

  // We no longer use Next/Image blur placeholder; keep a solid gray block until fully loaded

  // Handle image load - Next.js Image wraps in span, so we need to check the actual img
  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Hide shimmer immediately when image loads
    setIsLoaded(true);
    setShowShimmer(false);
    onLoad?.(e);
  };

  // Handle image error
  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setHasError(true);
    setShowShimmer(false);
    onError?.(e);
  };

  // Container styles
  const containerStyle: React.CSSProperties = {};
  if (fill) {
    // When using fill, container should be absolutely positioned
    containerStyle.position = 'absolute';
    containerStyle.top = '0';
    containerStyle.right = '0';
    containerStyle.bottom = '0';
    containerStyle.left = '0';
    containerStyle.width = '100%';
    containerStyle.height = '100%';
    if (aspectRatio) {
      containerStyle.aspectRatio = aspectRatio;
    }
  } else {
    // When not using fill, use width/height or aspectRatio
    if (aspectRatio) {
      containerStyle.aspectRatio = aspectRatio;
    }
    if (typeof width === "number") {
      containerStyle.width = width;
    }
    if (typeof height === "number") {
      containerStyle.height = height;
    }
  }

  const containerClasses = cn(
    "image-aspect-container",
    isLoaded && "image-loaded",
    containerClassName
  );

  const imageClasses = cn(
    className,
    isLoaded && "image-fade-in"
  );

  return (
    <div
      ref={containerRef}
      className={containerClasses}
      style={Object.keys(containerStyle).length > 0 ? containerStyle : undefined}
    >
      {!isLoaded && !hasError && (
        <div className={`absolute inset-0 ${shimmerBgColor} z-0`} />
      )}
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        className={imageClasses}
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        decoding="sync"
        style={{ 
          opacity: isLoaded ? 1 : 0,
          visibility: isLoaded ? 'visible' : 'hidden'
        }}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
      {hasError && (
        <div className={`absolute inset-0 ${shimmerBgColor} flex items-center justify-center`}>
          <span className="text-gray-400 text-xs">Image unavailable</span>
        </div>
      )}
    </div>
  );
}

/**
 * Regular img tag wrapper with shimmer effect
 * Use when Next.js Image is not suitable
 */
interface ImgWithShimmerProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  aspectRatio?: string;
  showShimmerOverlay?: boolean;
  shimmerBgColor?: string;
  containerClassName?: string;
}

export function ImgWithShimmer({
  src,
  alt,
  aspectRatio,
  showShimmerOverlay = true,
  shimmerBgColor = "bg-gray-200",
  className,
  containerClassName,
  onLoad,
  onError,
  ...props
}: ImgWithShimmerProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showShimmer, setShowShimmer] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Check if image is already loaded (e.g., cached images)
  useEffect(() => {
    const checkImageLoaded = () => {
      if (containerRef.current) {
        const img = containerRef.current.querySelector('img');
        if (img && img.complete && img.naturalHeight !== 0) {
          setIsLoaded(true);
          setShowShimmer(false);
        }
      }
    };

    checkImageLoaded();
    const timeout = setTimeout(checkImageLoaded, 100);
    return () => clearTimeout(timeout);
  }, [src]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    setShowShimmer(false);
    onLoad?.(e);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setHasError(true);
    setShowShimmer(false);
    onError?.(e);
  };

  const containerStyle: React.CSSProperties = {};
  if (aspectRatio) {
    containerStyle.aspectRatio = aspectRatio;
  }

  const containerClasses = cn(
    "image-aspect-container",
    showShimmer && !isLoaded && showShimmerOverlay && "shimmer",
    isLoaded && "image-loaded",
    containerClassName
  );

  const imageClasses = cn(
    className,
    isLoaded && "image-fade-in"
  );

  return (
    <div ref={containerRef} className={containerClasses} style={containerStyle}>
      {!isLoaded && !hasError && (
        <div className={`absolute inset-0 ${shimmerBgColor} z-0`} />
      )}
      <img
        src={src}
        alt={alt}
        className={imageClasses}
        loading="lazy"
        decoding="sync"
        style={{ 
          position: 'relative', 
          zIndex: 1,
          opacity: isLoaded ? 1 : 0,
          visibility: isLoaded ? 'visible' : 'hidden'
        }}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
      {hasError && (
        <div className={`absolute inset-0 ${shimmerBgColor} flex items-center justify-center`}>
          <span className="text-gray-400 text-xs">Image unavailable</span>
        </div>
      )}
    </div>
  );
}

