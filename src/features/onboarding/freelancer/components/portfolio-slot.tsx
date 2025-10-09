"use client";

import { useState } from "react";
import { Card, CardContent } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Button } from "@/ui/components/button";
import { useImageUpload } from "@/core/hooks/use-upload";
import { toast } from "sonner";
import { X, Upload, Image as ImageIcon } from "lucide-react";

interface PortfolioSlotProps {
  slotIndex: number;
  portfolio?: {
    id?: string;
    title: string;
    description: string;
    projectUrl: string;
    imageUrl: string;
  };
  onUpdate: (slotIndex: number, portfolio: {
    title: string;
    description: string;
    projectUrl: string;
    imageUrl: string;
  }) => void;
  onRemove: (slotIndex: number) => void;
}

export function PortfolioSlot({ slotIndex, portfolio, onUpdate, onRemove }: PortfolioSlotProps) {
  const [title, setTitle] = useState(portfolio?.title || "");
  const [description, setDescription] = useState(portfolio?.description || "");
  const [projectUrl, setProjectUrl] = useState(portfolio?.projectUrl || "");
  const [imageUrl, setImageUrl] = useState(portfolio?.imageUrl || "");

  const { uploadImage, isUploading } = useImageUpload({
    onSuccess: (result) => {
      setImageUrl(result.url);
      onUpdate(slotIndex, {
        title,
        description,
        projectUrl,
        imageUrl: result.url,
      });
    },
    onError: (error) => {
      console.error('Portfolio image upload error:', error);
      toast.error("Failed to upload image");
    }
  });

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File is too large (max 10MB)");
      return;
    }

    try {
      await uploadImage(file, "portfolio", 10);
    } catch (error) {
      console.error("Failed to upload image:", error);
      toast.error("Failed to upload image");
    }
  };

  const handleUpdate = () => {
    onUpdate(slotIndex, {
      title,
      description,
      projectUrl,
      imageUrl,
    });
  };

  const handleRemove = () => {
    onRemove(slotIndex);
  };

  const hasContent = title || description || projectUrl || imageUrl;

  return (
    <Card className="relative">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Portfolio #{slotIndex + 1}</h3>
          {hasContent && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Image Upload Section */}
        <div className="space-y-2">
          <Label>Project Image</Label>
          {imageUrl ? (
            <div className="relative group">
              <img 
                src={imageUrl} 
                alt="Portfolio" 
                className="w-full h-32 object-cover rounded-md border"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  disabled={isUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="text-white text-sm">
                  {isUploading ? "Uploading..." : "Click to change"}
                </div>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files)}
                disabled={isUploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center space-y-2">
                {isUploading ? (
                  <div className="text-gray-500">Uploading...</div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-gray-400" />
                    <div className="text-sm text-gray-500">
                      Click to upload project image
                    </div>
                    <div className="text-xs text-gray-400">
                      Max 10MB, JPG/PNG/GIF
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Project Information */}
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Project Title</Label>
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleUpdate}
              placeholder="Enter project title"
            />
          </div>

          <div className="space-y-1">
            <Label>Description</Label>
            <Input 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleUpdate}
              placeholder="Brief description of the project"
            />
          </div>

          <div className="space-y-1">
            <Label>Project URL (Optional)</Label>
            <Input 
              value={projectUrl} 
              onChange={(e) => setProjectUrl(e.target.value)}
              onBlur={handleUpdate}
              placeholder="https://your-project.com"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

