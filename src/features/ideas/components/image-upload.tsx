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
    const url = urlInput.trim();
    if (url) {
      // Validate URL format
      try {
        new URL(url);
        onChange(url);
        setUrlInput("");
        setShowUrlInput(false);
        toast.success("Image URL set");
      } catch (e) {
        toast.error("Please enter a valid URL");
      }
    }
  };

  // Handle paste event
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText && (pastedText.startsWith('http://') || pastedText.startsWith('https://'))) {
      e.preventDefault();
      setUrlInput(pastedText);
      // Auto-submit if it looks like a valid image URL
      setTimeout(() => {
        try {
          new URL(pastedText);
          onChange(pastedText);
          setUrlInput("");
          setShowUrlInput(false);
          toast.success("Image URL set");
        } catch (e) {
          // If not valid URL, just set the input value
          setUrlInput(pastedText);
        }
      }, 100);
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
              toast.error("Failed to load image. Please check the URL.");
            }}
            onLoad={() => {
              // Image loaded successfully
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

      {/* Upload Options - Always show to allow changing image */}
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
            {isUploading ? "Uploading..." : value ? "Change Image" : "Upload Image"}
          </Button>
        </div>

        {/* URL Input */}
        {showUrlInput && (
          <div className="flex gap-2">
            <Input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onPaste={handlePaste}
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

      {/* Help Text */}
      <p className="text-sm text-gray-500">
        {value ? "Click the X to remove the image" : `Upload an image (max ${maxSize}MB) or paste a direct URL`}
      </p>
    </div>
  );
}
