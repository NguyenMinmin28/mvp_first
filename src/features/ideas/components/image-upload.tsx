"use client";

import { useState, useRef } from "react";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useImageUpload } from "@/core/hooks/use-upload";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  maxSize?: number; // in MB
  folder?: string;
}

export function ImageUpload({
  value = "",
  onChange,
  disabled = false,
  label = "Cover Image",
  placeholder = "Upload an image or paste a URL",
  maxSize = 10,
  folder = "ideas"
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const { uploadImage, isUploading } = useImageUpload({
    onSuccess: (result) => {
      onChange(result.url);
    },
    onError: (error) => {
      console.error('Upload error:', error);
    }
  });
  const [showUrlInput, setShowUrlInput] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    await uploadImage(file, folder, maxSize);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput("");
      setShowUrlInput(false);
      toast.success("Image URL set");
    }
  };

  const handleClear = () => {
    onChange("");
    setUrlInput("");
    setShowUrlInput(false);
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      
      {/* Current Image Preview */}
      {value && (
        <div className="relative">
          <img
            src={value}
            alt="Preview"
            className="w-full max-w-md h-48 object-cover rounded-lg border"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            disabled={disabled}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Options */}
      {!value && (
        <div className="space-y-3">
          {/* File Upload */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
              className="flex items-center gap-2"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {isUploading ? "Uploading..." : "Upload Image"}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowUrlInput(!showUrlInput)}
              disabled={disabled}
              className="flex items-center gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              Paste URL
            </Button>
          </div>

          {/* URL Input */}
          {showUrlInput && (
            <div className="flex gap-2">
              <Input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                disabled={disabled}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleUrlSubmit}
                disabled={disabled || !urlInput.trim()}
                size="sm"
              >
                Set
              </Button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={disabled}
          />
        </div>
      )}

      {/* Help Text */}
      <p className="text-sm text-gray-500">
        {value ? "Click the X to remove the image" : `Upload an image (max ${maxSize}MB) or paste a direct URL`}
      </p>
    </div>
  );
}
