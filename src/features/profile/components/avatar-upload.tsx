"use client";

import { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/components/avatar";
import { Button } from "@/ui/components/button";
import { Label } from "@/ui/components/label";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
  const [isUploading, setIsUploading] = useState(false);

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
              setIsUploading(true);
              // Try to delete previous image if it belongs to Cloudinary
              const oldPublicId = extractPublicId(previewUrl);
              if (oldPublicId) {
                fetch("/api/uploads/cloudinary-delete", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ publicId: oldPublicId }),
                }).catch(() => {});
              }

              // Prefer signed upload if server keys are configured
              const signRes = await fetch("/api/uploads/cloudinary-sign", { method: "POST", body: JSON.stringify({ folder: "avatars" }) as any, headers: { "Content-Type": "application/json" } });
              if (signRes.ok) {
                const { cloudName, apiKey, timestamp, folder, signature } = await signRes.json();
                const formData = new FormData();
                formData.append("file", file);
                formData.append("api_key", apiKey);
                formData.append("timestamp", String(timestamp));
                formData.append("folder", folder || "avatars");
                formData.append("signature", signature);
                const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: formData });
                const json = await res.json();
                if (!res.ok) throw new Error(json?.error?.message || "Upload failed");
                const url = json.secure_url as string;
                setPreviewUrl(url);
                onChange(url);
                toast.success("Uploaded avatar");
              } else {
                // Fallback to unsigned if signature API not available
                const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME as string | undefined;
                const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET as string | undefined;
                if (!cloudName || !uploadPreset) {
                  toast.error("Cloudinary not configured");
                  return;
                }
                const formData = new FormData();
                formData.append("file", file);
                formData.append("upload_preset", uploadPreset);
                const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: formData });
                const json = await res.json();
                if (!res.ok) throw new Error(json?.error?.message || "Upload failed");
                const url = json.secure_url as string;
                setPreviewUrl(url);
                onChange(url);
                toast.success("Uploaded avatar");
              }
            } catch (err: any) {
              toast.error(err?.message || "Failed to upload");
            } finally {
              if (fileInputRef.current) fileInputRef.current.value = "";
              setIsUploading(false);
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
