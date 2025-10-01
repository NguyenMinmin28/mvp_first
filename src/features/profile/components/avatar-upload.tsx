"use client";

import { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/components/avatar";
import { Button } from "@/ui/components/button";
import { Label } from "@/ui/components/label";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useImageUpload, useUpload } from "@/core/hooks/use-upload";

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { uploadImage, isUploading } = useImageUpload({
    onSuccess: (result) => {
      setPreviewUrl(result.url);
      onChange(result.url);
    },
    onError: (error) => {
      console.error('Avatar upload error:', error);
    }
  });
  const { deleteFile } = useUpload({
    onSuccess: () => {
      console.log('Old avatar deleted successfully');
    },
    onError: (error) => {
      console.warn('Failed to delete old avatar:', error);
    },
    showToast: false // Don't show toast for delete operations
  });

  const handleUrlChange = (url: string) => {
    setPreviewUrl(url);
    onChange(url);
  };

  const handleClear = () => {
    setPreviewUrl("");
    onChange("");
  };

  const extractPublicId = (url: string | undefined) => {
    if (!url) return undefined;
    try {
      // Example: https://res.cloudinary.com/<cloud>/image/upload/v123456/avatars/abc_xyz.png
      const parts = url.split("/upload/")[1];
      if (!parts) return undefined;
      const path = parts.replace(/^v\d+\//, "");
      const last = path.split(".")[0];
      return last; // e.g., avatars/abc_xyz
    } catch {
      return undefined;
    }
  };

  const sizeClasses = {
    sm: "h-24 w-24",
    md: "h-32 w-32", 
    lg: "h-40 w-40"
  };

  const fallbackText = name ? name.slice(0, 2).toUpperCase() : "AV";

  return (
    <div className="space-y-2">
      {showLabel && <Label>Profile Photo</Label>}
      
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          disabled={disabled || isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="relative"
          title={disabled ? "Editing disabled" : (isUploading ? "Uploading..." : "Click to upload")}
        >
          <Avatar className={sizeClasses[size]}>
            <AvatarImage src={previewUrl || undefined} />
            <AvatarFallback className="text-lg">
              {fallbackText}
            </AvatarFallback>
          </Avatar>
          {/* Hint overlay when editable */}
          {!disabled && !isUploading && (
            <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 rounded-b-full bg-gradient-to-t from-black/50 to-transparent flex items-end justify-center pb-1">
              <span className="text-[10px] sm:text-xs text-white/80">Click here to change your picture</span>
            </span>
          )}
          {isUploading && (
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </span>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            
            try {
              // Try to delete previous image if it belongs to Cloudinary
              const oldPublicId = extractPublicId(previewUrl);
              if (oldPublicId) {
                await deleteFile(oldPublicId);
              }

              // Upload new image using centralized service
              await uploadImage(file, "avatars", 5); // 5MB max for avatars
            } catch (err: any) {
              console.error("Upload error:", err);
              toast.error(err?.message || "Failed to upload avatar");
            } finally {
              if (fileInputRef.current) fileInputRef.current.value = "";
            }
          }}
        />
        
        <div className="space-y-2 flex flex-col items-center">
          <div className="flex items-center gap-2">
            {!disabled && previewUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                title="Remove current photo"
                className="h-8 px-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <X className="h-4 w-4 mr-1" />
                <span className="text-xs">Remove photo</span>
              </Button>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {disabled ? "Profile photo will be displayed in your profile and listings." : (isUploading ? "Uploading..." : "Click the avatar to upload a photo. For best results, use a square image (1:1).")}
          </p>
        </div>
      </div>
    </div>
  );
}
