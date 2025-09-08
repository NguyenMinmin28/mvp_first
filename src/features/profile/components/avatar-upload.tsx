"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/components/avatar";
import { Input } from "@/ui/components/input";
import { Button } from "@/ui/components/button";
import { Label } from "@/ui/components/label";
import { X, Upload, User } from "lucide-react";

interface AvatarUploadProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  name?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export default function AvatarUpload({
  value = "",
  onChange,
  disabled = false,
  name = "",
  size = "md",
  showLabel = true,
}: AvatarUploadProps) {
  const [previewUrl, setPreviewUrl] = useState(value);

  const handleUrlChange = (url: string) => {
    setPreviewUrl(url);
    onChange(url);
  };

  const handleClear = () => {
    setPreviewUrl("");
    onChange("");
  };

  const sizeClasses = {
    sm: "h-12 w-12",
    md: "h-20 w-20", 
    lg: "h-24 w-24"
  };

  const fallbackText = name ? name.slice(0, 2).toUpperCase() : "AV";

  return (
    <div className="space-y-2">
      {showLabel && <Label>Profile Photo</Label>}
      
      <div className="flex items-center gap-4">
        <Avatar className={sizeClasses[size]}>
          <AvatarImage src={previewUrl || undefined} />
          <AvatarFallback className="text-lg">
            {fallbackText}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Input
              value={previewUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              disabled={disabled}
              placeholder="Enter image URL (e.g., https://example.com/photo.jpg)"
              className="text-sm"
            />
            {!disabled && previewUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClear}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <p className="text-xs text-gray-500">
            {disabled 
              ? "Profile photo will be displayed in your profile and listings."
              : "Enter a direct image URL. For best results, use a square image (1:1 ratio)."
            }
          </p>
        </div>
      </div>
    </div>
  );
}
