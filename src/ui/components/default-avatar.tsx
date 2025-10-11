"use client";

import * as React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";
import { cn } from "@/core/utils/utils";

interface DefaultAvatarProps {
  src?: string;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
  onClick?: () => void;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10", 
  lg: "h-12 w-12",
  xl: "h-16 w-16"
};

export function DefaultAvatar({ 
  src, 
  alt = "User Avatar", 
  className,
  fallbackClassName,
  onClick,
  size = "md"
}: DefaultAvatarProps) {
  const [imageError, setImageError] = React.useState(false);
  
  const handleImageError = () => {
    setImageError(true);
  };

  const avatarSrc = imageError || !src ? '/images/avata/default.jpeg' : src;

  return (
    <Avatar 
      className={cn(sizeClasses[size], className)} 
      onClick={onClick}
    >
      <AvatarImage 
        src={avatarSrc}
        alt={alt}
        className="object-cover"
        onError={handleImageError}
      />
      <AvatarFallback className={cn("bg-gray-200 w-full h-full flex items-center justify-center", fallbackClassName)}>
        <img 
          src="/images/avata/default.jpeg" 
          alt="Default Avatar"
          className="w-full h-full object-cover rounded-full"
          onError={(e) => {
            // If default image also fails, hide it
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </AvatarFallback>
    </Avatar>
  );
}
