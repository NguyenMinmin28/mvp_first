"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/core/utils/utils";

// Fade In Animation
export interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export const FadeIn = ({ children, delay = 0, duration = 500, className }: FadeInProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-opacity duration-500 ease-out",
        isVisible ? "opacity-100" : "opacity-0",
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
};

// Slide Up Animation
export interface SlideUpProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
}

export const SlideUp = ({ 
  children, 
  delay = 0, 
  duration = 500, 
  distance = 20,
  className 
}: SlideUpProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-500 ease-out",
        isVisible 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-5",
        className
      )}
      style={{ 
        transitionDuration: `${duration}ms`,
        transform: isVisible ? 'translateY(0)' : `translateY(${distance}px)`
      }}
    >
      {children}
    </div>
  );
};

// Scale In Animation
export interface ScaleInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  scale?: number;
  className?: string;
}

export const ScaleIn = ({ 
  children, 
  delay = 0, 
  duration = 300, 
  scale = 0.95,
  className 
}: ScaleInProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-300 ease-out",
        isVisible 
          ? "opacity-100 scale-100" 
          : "opacity-0 scale-95",
        className
      )}
      style={{ 
        transitionDuration: `${duration}ms`,
        transform: isVisible ? 'scale(1)' : `scale(${scale})`
      }}
    >
      {children}
    </div>
  );
};

// Stagger Animation for lists
export interface StaggerProps {
  children: React.ReactNode[];
  delay?: number;
  staggerDelay?: number;
  className?: string;
}

export const Stagger = ({ 
  children, 
  delay = 0, 
  staggerDelay = 100,
  className 
}: StaggerProps) => {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <FadeIn
          key={index}
          delay={delay + (index * staggerDelay)}
          duration={400}
        >
          {child}
        </FadeIn>
      ))}
    </div>
  );
};

// Intersection Observer Hook
export const useIntersectionObserver = (
  ref: React.RefObject<Element>,
  options?: IntersectionObserverInit
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      options
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [ref, options]);

  return isIntersecting;
};

// Animate on Scroll Component
export interface AnimateOnScrollProps {
  children: React.ReactNode;
  animation?: "fadeIn" | "slideUp" | "scaleIn";
  delay?: number;
  threshold?: number;
  className?: string;
}

export const AnimateOnScroll = ({
  children,
  animation = "fadeIn",
  delay = 0,
  threshold = 0.1,
  className
}: AnimateOnScrollProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isIntersecting = useIntersectionObserver(ref, { threshold });

  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (isIntersecting && !hasAnimated) {
      const timer = setTimeout(() => {
        setHasAnimated(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [isIntersecting, hasAnimated, delay]);

  const animationClasses = {
    fadeIn: hasAnimated ? "opacity-100" : "opacity-0",
    slideUp: hasAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
    scaleIn: hasAnimated ? "opacity-100 scale-100" : "opacity-0 scale-95"
  };

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        animationClasses[animation],
        className
      )}
    >
      {children}
    </div>
  );
};

// Hover Animation Component
export interface HoverAnimationProps {
  children: React.ReactNode;
  scale?: number;
  rotate?: number;
  className?: string;
}

export const HoverAnimation = ({
  children,
  scale = 1.05,
  rotate = 0,
  className
}: HoverAnimationProps) => {
  return (
    <div
      className={cn(
        "transition-all duration-300 ease-out cursor-pointer",
        "hover:scale-105 hover:shadow-lg",
        className
      )}
      style={{
        transform: `scale(${scale}) rotate(${rotate}deg)`
      }}
    >
      {children}
    </div>
  );
};

// Pulse Animation
export interface PulseProps {
  children: React.ReactNode;
  duration?: number;
  className?: string;
}

export const Pulse = ({ children, duration = 2000, className }: PulseProps) => {
  return (
    <div
      className={cn("animate-pulse", className)}
      style={{ animationDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
};

// Bounce Animation
export interface BounceProps {
  children: React.ReactNode;
  className?: string;
}

export const Bounce = ({ children, className }: BounceProps) => {
  return (
    <div className={cn("animate-bounce", className)}>
      {children}
    </div>
  );
};

// Shake Animation
export interface ShakeProps {
  children: React.ReactNode;
  className?: string;
}

export const Shake = ({ children, className }: ShakeProps) => {
  return (
    <div className={cn("animate-shake", className)}>
      {children}
    </div>
  );
};

// Custom CSS for shake animation
export const shakeKeyframes = `
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
  20%, 40%, 60%, 80% { transform: translateX(10px); }
}
`;

// Floating Animation
export interface FloatingProps {
  children: React.ReactNode;
  duration?: number;
  className?: string;
}

export const Floating = ({ children, duration = 3000, className }: FloatingProps) => {
  return (
    <div
      className={cn("animate-float", className)}
      style={{ animationDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
};

// Custom CSS for floating animation
export const floatKeyframes = `
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}
`;
