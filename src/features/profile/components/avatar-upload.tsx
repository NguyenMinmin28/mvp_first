"use client";

import { useRef, useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/components/avatar";
import { Button } from "@/ui/components/button";
import { Label } from "@/ui/components/label";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useImageUpload, useUpload } from "@/core/hooks/use-upload";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/ui/components/tooltip";
import { AvatarCropModal } from "./avatar-crop-modal";

interface AvatarUploadProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  name?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  onSave?: (photoUrl: string) => Promise<void>;
  allowDirectUpload?: boolean;
}

export default function AvatarUpload({
  value = "",
  onChange,
  disabled = false,
  name = "",
  size = "md",
  showLabel = true,
  onSave,
  allowDirectUpload = false,
}: AvatarUploadProps) {
  const [previewUrl, setPreviewUrl] = useState(value);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Update previewUrl when value prop changes
  useEffect(() => {
    setPreviewUrl(value);
  }, [value]);
  const { uploadImage, isUploading } = useImageUpload({
    onSuccess: async (result) => {
      setPreviewUrl(result.url);
      onChange(result.url);
      // Auto-save if onSave callback is provided
      if (onSave) {
        try {
          await onSave(result.url);
        } catch (error) {
          console.error('Failed to save avatar:', error);
        }
      }
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

  const handleClear = async () => {
    // Try to delete old image from Cloudinary if it exists
    const oldPublicId = extractPublicId(previewUrl);
    if (oldPublicId) {
      try {
        await deleteFile(oldPublicId);
      } catch (error) {
        console.warn('Failed to delete old avatar:', error);
      }
    }
    
    setPreviewUrl("");
    onChange("");
    // Auto-save if onSave callback is provided
    if (onSave) {
      try {
        await onSave("");
      } catch (error) {
        console.error('Failed to save avatar removal:', error);
      }
    }
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
    <TooltipProvider>
      <div className="space-y-2">
        {showLabel && <Label>Profile Photo</Label>}
        
        <div className="flex flex-col items-center gap-3">
          <div className="relative group">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  disabled={(disabled && !allowDirectUpload) || isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="relative"
                >
                  <Avatar className={sizeClasses[size]}>
                    <AvatarImage src={previewUrl || undefined} />
                    <AvatarFallback className="text-lg">
                      {fallbackText}
                    </AvatarFallback>
                  </Avatar>
                  {isUploading && (
                    <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              {!isUploading && (disabled && !allowDirectUpload ? (
                <TooltipContent>
                  <p>Editing disabled</p>
                </TooltipContent>
              ) : (
                <TooltipContent>
                  <p>Click to upload a photo. For best results, use a square image (1:1).</p>
                </TooltipContent>
              ))}
            </Tooltip>
            
            {/* Delete button - appears on hover, top left corner */}
            {(!disabled || allowDirectUpload) && previewUrl && !isUploading && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="absolute -top-2 -left-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                title="Remove photo"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              
              // Validate file type
              if (!file.type.startsWith("image/")) {
                toast.error("Please select an image file");
                if (fileInputRef.current) fileInputRef.current.value = "";
                return;
              }
              
              // Validate file size (5MB max)
              if (file.size > 5 * 1024 * 1024) {
                toast.error("Image size must be less than 5MB");
                if (fileInputRef.current) fileInputRef.current.value = "";
                return;
              }
              
              // Read file and show crop modal
              const reader = new FileReader();
              reader.onload = () => {
                setImageToCrop(reader.result as string);
                setCropModalOpen(true);
              };
              reader.onerror = () => {
                toast.error("Failed to read image file");
              };
              reader.readAsDataURL(file);
              
              // Reset input
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          />
          
          {/* Crop Modal */}
          <AvatarCropModal
            open={cropModalOpen}
            onClose={() => {
              setCropModalOpen(false);
              setImageToCrop("");
            }}
            imageSrc={imageToCrop}
            onCropComplete={async (croppedImageBlob) => {
              try {
                // Convert blob to file
                const file = new File(
                  [croppedImageBlob],
                  `avatar-${Date.now()}.png`,
                  { type: "image/png" }
                );
                
                // Try to delete previous image if it belongs to Cloudinary
                const oldPublicId = extractPublicId(previewUrl);
                if (oldPublicId) {
                  await deleteFile(oldPublicId);
                }

                // Upload cropped image using centralized service
                await uploadImage(file, "avatars", 5); // 5MB max for avatars
                
                // Close crop modal
                setCropModalOpen(false);
                setImageToCrop("");
              } catch (err: any) {
                console.error("Upload error:", err);
                toast.error(err?.message || "Failed to upload avatar");
              }
            }}
            isUploading={isUploading}
          />
          
          {isUploading && (
            <p className="text-xs text-gray-500">Uploading...</p>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
